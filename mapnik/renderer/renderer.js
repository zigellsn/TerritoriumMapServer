'use strict';

const mapnik = require('mapnik');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over';

function Renderer() {
}

function prepareRenderer(long0, lat0, long1, lat1, imgx, imgy, callback) {

    let merc = new mapnik.Projection(srs);

    mapnik.register_system_fonts();
    mapnik.register_default_input_plugins();

    let map = new mapnik.Map(imgx, imgy);
    map.load('/input/osm-de.xml', function (err, map) {
        let bbox = [long0, lat0, long1, lat1];
        let mercBBox = merc.forward(bbox);
        map.zoomToBox(mercBBox);
        callback(map);
    });
}

function prepareRendererSync(long0, lat0, long1, lat1, imgx, imgy) {

    let merc = new mapnik.Projection(srs);

    mapnik.register_system_fonts();
    mapnik.register_default_input_plugins();

    let map = new mapnik.Map(imgx, imgy);
    map.loadSync('/input/osm-de.xml');
    let bbox = [long0, lat0, long1, lat1];
    let mercBBox = merc.forward(bbox);
    map.zoomToBox(mercBBox);
    return map;
}

Renderer.prototype.map = function (long0, lat0, long1, lat1, width, height, imgtype) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;

    try {
        let m = prepareRendererSync(long0, lat0, long1, lat1, imgx, imgy);
        if (imgtype === 'svg') {
            if (!mapnik.supports.cairo) {
                console.log('So sad... No Cairo');
                return undefined;
            }
            let filename = uuidv4();
            m.renderFileSync(filename, {format: imgtype});
            let buffer = fs.readFileSync(filename);
            fs.unlinkSync(filename);
            return buffer;
        } else {
            return m.renderSync({format: imgtype});
        }
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
