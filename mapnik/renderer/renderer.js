'use strict';

const mapnik = require('mapnik');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const {createCanvas, Image} = require('canvas');
const srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over';
const copyright = '© OpenStreetMap contributors';

const merc = new mapnik.Projection(srs);

function Renderer() {
    console.log(mapnik.versions);
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

Renderer.prototype.map = function (polygon /*, size, bbox, way, mimeType, layers, names*/) {

    function createLayers(polygon) {
        let layers = [];
        let globalStyle = '';
        if (polygon.hasOwnProperty('way') && polygon['way'] !== undefined) {
            if (polygon.hasOwnProperty('style') && polygon['style'] !== undefined) {
                globalStyle = polygon['style']['name'];
            }
            layers.push({way: polygon['way'], name: polygon['name'], styleName: globalStyle});
        }
        if (polygon.hasOwnProperty('subpolygon')) {
            let subPolygons = polygon['subpolygon'];
            for (const layer of subPolygons) {
                if (layer.hasOwnProperty('way') && layer['way'] !== undefined) {
                    let style = globalStyle;
                    if (polygon.hasOwnProperty('style') && polygon['style'] !== undefined) {
                        style = polygon['style']['name'];
                    }
                    layers.push({way: layer['way'], name: layer['name'], styleName: style});
                }
            }
        }
        return layers;
    }

    function createUniqueStyles(polygon) {
        let styles = [];
        if (polygon.hasOwnProperty('style'))
            styles.push(polygon['style']);
        if (polygon.hasOwnProperty('subpolygon')) {
            let subPolygons = polygon['subpolygon'];
            for (const layer of subPolygons) {
                if (layer.hasOwnProperty('style'))
                    styles.push(layer['style'])
            }
        }
        return getUnique(styles, 'name');
    }

    function getUnique(arr, comp) {
        return arr
            .map(e => e[comp])
            .map((e, i, final) => final.indexOf(e) === i && i)
            .filter(e => arr[e]).map(e => arr[e]);
    }

    function getInline(layers) {
        let nameString = 'name,x,y\n';
        for (const layer of layers) {
            if (!layer.hasOwnProperty('name'))
                continue;
            if (layer['name'].hasOwnProperty('position') && layer['name'].hasOwnProperty('text'))
                nameString += `"${layer['name']['text']}",${layer['name']['position'][0]},${layer['name']['position'][1]}\n`;
            else
                //TODO: PointOnSurface for name position
                nameString += `"${layer['name']['text']}",,\n`;
        }
        return nameString;
    }

    function createStyles(layers) {
        let s = '<Map>';
        let textSize = 0;
        for (const layer of layers) {
            s += `<Style name="${layer.name}">`;
            s += ` <Rule><LineSymbolizer stroke="${layer.color}" stroke-width="${layer.width}" stroke-opacity="${layer.opacity}"/></Rule>`;
            s += '</Style>';
            if (layer.hasOwnProperty('size')) {
                textSize = layer['size'];
            }
        }
        if (textSize === 0)
            textSize = 12;
        s += '<Style name="names_style">';
        s += ' <Rule>';
        s += `  <TextSymbolizer face-name="DejaVu Sans Book" size="${textSize}" fill="white" halo-fill="black" halo-radius="2" horizontal-alignment="middle">[name]</TextSymbolizer>`;
        s += ' </Rule>';
        s += '</Style>';
        s += '</Map>';
        return s;
    }

    function addAdditionalLayers(m, layers, styles, inline) {

        m.fromStringSync(styles);

        let i = 0;
        //TODO: Merge layers with the same style
        for (const l of layers) {
            let ds = new mapnik.Datasource({
                type: 'geojson',
                inline: JSON.stringify(l['way'])
            });
            let layer = new mapnik.Layer(`border${i}`, srs);
            layer.datasource = ds;
            layer.styles = [l['styleName']];
            m.add_layer(layer);
            i++;
        }

        let ds_names = new mapnik.Datasource({
            type: 'csv',
            inline: inline
        });
        let layer = new mapnik.Layer('names', srs);
        layer.datasource = ds_names;
        layer.styles = ['names_style'];
        m.add_layer(layer);
    }

    try {
        let layers = createLayers(polygon);
        let uniqueStyles = createUniqueStyles(polygon);
        let styles = createStyles(uniqueStyles);
        let inline = getInline(layers);

        let m = new mapnik.Map(polygon['size'][0], polygon['size'][1]);
        m.loadSync('/input/osm-de.xml');
        m.zoomToBox(polygon['bbox']);
        addAdditionalLayers(m, layers, styles, inline);
        let src;
        if (polygon['mimeType'] === 'image/xml+svg') {
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
