const express = require('express');
const Renderer = require('../renderer/renderer');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

// Legacy renderer
router.get('/territorium/map', function (req, res, next) {
    if (req.query.long0 === undefined || req.query.lat0 === undefined ||
        req.query.long1 === undefined || req.query.lat1 === undefined ||
        req.query.width === undefined || req.query.height === undefined) {
        res.status(404).send('Missing parameter(s)');
        return;
    }

    let imgtype = 'png';
    if (req.query.type !== undefined)
        imgtype = req.query.type;

    try {
        let renderer = new Renderer();
        let buffer = renderer.map(req.query.long0, req.query.lat0, req.query.long1, req.query.lat1, req.query.width, req.query.height, imgtype);
        if (buffer === undefined) {
            res.status(404).send('Render error');
            return;
        }
        if (imgtype === 'svg')
            res.type('image/svg+xml');
        else
            res.type('image/png');
        res.set({
            'Content-Length': buffer.length,
            'Content-Disposition': `attachment; filename=map.${imgtype}`,
            'Content-Transfer-Encoding': 'Binary',
            'Cache-Control': 'Public'
        });
        res.send(buffer);
        return;
    } catch (e) {
        console.log(e);
    }
    res.render('index', {title: 'Express'});
});

// Legacy renderer
router.get('/territorium/worldfile', function (req, res, next) {
    if (req.query.long0 === undefined || req.query.lat0 === undefined ||
        req.query.long1 === undefined || req.query.lat1 === undefined ||
        req.query.width === undefined || req.query.height === undefined) {
        res.status(404).send('Missing parameter(s)');
        return;
    }

    try {
        let renderer = new Renderer();
        let buffer = renderer.worldfile(req.query.long0, req.query.lat0, req.query.long1, req.query.lat1, req.query.width, req.query.height);
        res.type('text/plain');
        res.set({
            'Content-Length': buffer.length,
            'Content-Disposition': `attachment; filename=map.pwg`,
            'Content-Transfer-Encoding': 'Binary',
            'Cache-Control': 'Public'
        });
        res.send(buffer);
    } catch (e) {
        console.log(e);
    }
    res.render('index', {title: 'Express'});
});

module.exports = router;