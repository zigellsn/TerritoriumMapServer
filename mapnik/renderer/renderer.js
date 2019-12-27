'use strict';

let mapnik = require('mapnik');

function Renderer() {

}

function prepareRenderer(lat0, long0, lat1, long1, x_rotation, y_rotation, imgx, imgy) {

    let merc = new mapnik.Projection('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over');
    let longlat = new mapnik.Projection('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');
    let transform = new mapnik.ProjTransform(longlat, merc);

    // register fonts and datasource plugins
    mapnik.register_default_fonts();
    mapnik.register_default_input_plugins();

    let map = new mapnik.Map(imgx, imgy, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over');
    map.load('/input/osm-de.xml', function (err, map) {
        if (err) throw err;
        let bbox = [long0, lat0, long1, lat1];
        let mercBBox = transform.forward(bbox);
        map.zoomToBox(mercBBox);
        return map;
    });
}

Renderer.prototype.map = function (lat0, long0, lat1, long1, x_rotation, y_rotation, width, height, imgtype) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;

    let m = prepareRenderer(lat0, long0, lat1, long1, x_rotation, y_rotation, imgx, imgy);

    if (imgtype === 'svg') {
        let surface = cairo.SVGSurface(response, m.width, m.height);
        mapnik.render(m, surface);
        surface.finish();
        return response;
    } else {
        let im = new mapnik.Image(imgx, imgy);
        mapnik.render(m, im);
        return im.tostring(imgtype);
    }


    /* let im = new mapnik.Image(imgx, imgy);
map.render(im, function (err, im) {
    if (err) throw err;
    im.encode('png', function (err, buffer) {
        if (err) throw err;
        fs.writeFile('map.png', buffer, function (err) {
            if (err) throw err;
            console.log('saved map image to map.png');
        });
    });
});*/


};

Renderer.prototype.worldfile = function (lat0, long0, lat1, long1, x_rotation, y_rotation, width, height) {

    let z = 1;
    let imgx = width * z;
    let imgy = height * z;

    let m;
    try {
        m = prepareRenderer(lat0, long0, lat1, long1, x_rotation, y_rotation, imgx, imgy);
    } catch (e) {
        return;
    }

    if (!m) return;

    let scale = m.scale();
    let extent = m.envelope();
    let upper_left_x_center = extent.minx + (scale / 2);
    let upper_left_y_center = extent.maxy + (scale / 2);
    return `${scale}\n${y_rotation}\n${x_rotation}\n-${scale}\n${upper_left_x_center}\n${upper_left_y_center}`;
};

module.exports = Renderer;