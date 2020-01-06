'use strict';

const mapnik = require('mapnik');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const {createCanvas, Image} = require('canvas');
const srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over';
const copyright = '© OpenStreetMap contributors';

const merc = new mapnik.Projection(srs);

function Renderer() {
    mapnik.register_system_fonts();
    mapnik.register_default_input_plugins();
}

function prepareRenderer(long0, lat0, long1, lat1, imgx, imgy, callback) {
    let map = new mapnik.Map(imgx, imgy);
    map.load('/input/osm-de.xml', function (err, map) {
        let bbox = [long0, lat0, long1, lat1];
        let mercBBox = merc.forward(bbox);
        map.zoomToBox(mercBBox);
        callback(map);
    });
}

function prepareRendererSync(long0, lat0, long1, lat1, imgx, imgy) {
    let map = new mapnik.Map(imgx, imgy);
    map.loadSync('/input/osm-de.xml');
    let bbox = [long0, lat0, long1, lat1];
    let mercBBox = merc.forward(bbox);
    map.zoomToBox(mercBBox);
    return map;
}

function addCopyrightTextRaster(src, width, height) {
    const canvas = createCanvas(width, height, 'PNG');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.onerror = err => {
        throw err
    };
    img.src = src;
    ctx.font = '10px DejaVu Sans Book';
    let text = ctx.measureText(copyright);
    ctx.fillText(copyright, 10, height - text.emHeightAscent - 10);
    return canvas.toBuffer();
}

function addCopyrightTextVector(src, width, height) {
    let len = src.length;
    return `${src.slice(0, len - 7)}<text fill="#0" font-size="10" font-family="sans-serif" x="10" y="${height - 32}"><tspan dy="18.2" x="10">${copyright}</tspan></text>${src.slice(len - 7, len)}`;
}

Renderer.prototype.map = function (size, bbox, way, mimeType, styles, names) {
    function getInline(names) {
        let nameString = 'name,x,y\n';
        for (let i = 0; i < names.length; i++) {
            nameString += `"${names[i].text}",${names[i].position[0]},${names[i].position[1]}\n`
        }
        return nameString;
    }

    function createStyles(styles) {
        let s = '<Map>';
        for (let i = 0; i < styles.length; i++) {
            s += `<Style name="${styles[i].name}">`;
            s += ` <Rule><LineSymbolizer stroke="${styles[i].color}" stroke-width="${styles[i].width}" stroke-opacity="${styles[i].opacity}"/></Rule>`;
            s += '</Style>';
        }
        s += '<Style name="names_style">';
        s += ' <Rule>';
        s += '  <TextSymbolizer face-name="DejaVu Sans Book" size="30" fill="white" halo-fill="black" halo-radius="2" >[name]</TextSymbolizer>';
        s += ' </Rule>';
        s += '</Style>';
        s += '</Map>';
        return s;
    }

    function addAdditionalLayers(m, way, styles, names) {
        let s = createStyles(styles);
        m.fromStringSync(s);
        let ds = new mapnik.Datasource({
            'type': 'geojson',
            'inline': way
        });
        let ds_names = new mapnik.Datasource({
            'type': 'csv',
            'inline': getInline(names)
        });
        let layer = new mapnik.Layer('border');
        layer.datasource = ds;
        layer.srs = srs;
        layer.styles = [styles[0].name];
        m.add_layer(layer);

        layer = new mapnik.Layer('names');
        layer.datasource = ds_names;
        layer.srs = srs;
        layer.styles = ['names_style'];
        m.add_layer(layer);
    }

    try {
        let m = new mapnik.Map(size[0], size[1]);
        m.loadSync('/input/osm-de.xml');
        m.zoomToBox(bbox);

        addAdditionalLayers(m, JSON.stringify(way), styles, names);
        let src;
        if (mimeType === 'image/xml+svg') {
            if (!mapnik.supports.cairo) {
                console.log('So sad... no Cairo');
                return undefined;
            }
            let filename = uuidv4();
            m.renderFileSync(filename, {format: 'SVG'});
            src = fs.readFileSync(filename);
            fs.unlinkSync(filename);
            src = addCopyrightTextVector(src, m.width, m.height);
        } else {
            src = m.renderSync({format: 'PNG'});
            src = addCopyrightTextRaster(src, m.width, m.height);
        }
        return src;
    } catch (e) {
        console.log(e);
    }

};

Renderer.prototype.mapLegacy = function (long0, lat0, long1, lat1, width, height, imgtype) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;

    try {
        let m = prepareRendererSync(long0, lat0, long1, lat1, imgx, imgy);
        let src;
        if (imgtype === 'svg') {
            if (!mapnik.supports.cairo) {
                console.log('So sad... no Cairo');
                return undefined;
            }
            let filename = uuidv4();
            m.renderFileSync(filename, {format: imgtype});
            src = fs.readFileSync(filename);
            fs.unlinkSync(filename);
            src = addCopyrightTextVector(src, m.width, m.height);
        } else {
            src = m.renderSync({format: imgtype});
            src = addCopyrightTextRaster(src, m.width, m.height);
        }
        return src;
    } catch (e) {
        console.log(e);
    }
};

Renderer.prototype.worldfile = function (long0, lat0, long1, lat1, width, height) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;

    try {
        let m = prepareRendererSync(long0, lat0, long1, lat1, imgx, imgy);
        if (!m) return;
        let scale = m.scale();
        let extent = m.extent;
        let upper_left_x_center = extent[0] + (scale / 2);
        let upper_left_y_center = extent[3] + (scale / 2);
        return `${scale}\n0\n0\n-${scale}\n${upper_left_x_center}\n${upper_left_y_center}`;
    } catch (e) {
        console.log(e);
    }
};

module.exports = Renderer;
