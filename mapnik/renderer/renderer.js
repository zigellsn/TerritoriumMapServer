'use strict';

const mapnik = require('mapnik');
const fs = require('fs');

function Renderer() {
}

function prepareRenderer(long0, lat0, long1, lat1, x_rotation, y_rotation, imgx, imgy, callback) {

    let merc = new mapnik.Projection('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over');
    // let longlat = new mapnik.Projection('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');
    //let transform = new mapnik.Projection(merc);

    // register fonts and datasource pluginis
    mapnik.register_system_fonts();
    mapnik.register_default_input_plugins();

    let map = new mapnik.Map(imgx, imgy, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over');
    map.load('/input/osm-de.xml', function (err, map) {
        let bbox = [long0, lat0, long1, lat1];
        let mercBBox = merc.forward(bbox);
        map.zoomToBox(mercBBox);
        callback(map);
    });
}

Renderer.prototype.map = function (long0, lat0, long1, lat1, x_rotation, y_rotation, width, height, imgtype, callback) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;

    prepareRenderer(long0, lat0, long1, lat1, x_rotation, y_rotation, imgx, imgy, function (m) {
        if (imgtype === 'svg') {
            let surface = cairo.SVGSurface(response, m.width, m.height);
            m.render(surface);
            surface.finish();
            callback(surface);
        } else {
            let im = new mapnik.Image(imgx, imgy);
            m.render(im, function (err, im) {
                if (err) throw err;
                im.encode(imgtype, function (err, buffer) {
                    if (err) throw err;
                    fs.writeFile(`/input/map.${imgtype}`, buffer, function (err) {
                        if (err) throw err;
                        console.log('saved map image to map.png');
                        callback(buffer);
                    });
                });
            });
        }
    });
};

Renderer.prototype.worldfile = function (long0, lat0, long1, lat1, x_rotation, y_rotation, width, height, callback) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;
    try {
        prepareRenderer(long0, lat0, long1, lat1, x_rotation, y_rotation, imgx, imgy, function (m) {
            if (!m) return;
            let scale = m.scale();
            let extent = m.extent;
            let upper_left_x_center = extent[0] + (scale / 2);
            let upper_left_y_center = extent[3] + (scale / 2);
            let content = `${scale}\n${y_rotation}\n${x_rotation}\n-${scale}\n${upper_left_x_center}\n${upper_left_y_center}`;
            callback(content);
        });
    } catch (e) {

    }
};

module.exports = Renderer;
