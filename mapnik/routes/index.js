const express = require('express');
const Renderer = require('../renderer/renderer');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.get('/territorium/map', function (req, res, next) {
    let renderer = new Renderer();
    try {
        let xrot = 0;
        if (req.query.xrotation !== undefined)
            xrot = req.query.xrotation;

        let yrot = 0;
        if (req.query.yrotation !== undefined)
            yrot = req.query.yrotation;

        let imgtype = 'png';
        if (req.query.type !== undefined)
            imgtype = req.query.type;

        renderer.map(req.query.long0, req.query.lat0, req.query.long1, req.query.lat1, xrot, yrot, req.query.width, req.query.height, imgtype, function (file) {
        });
    } catch (e) {
        console.log(e);
    }
    res.render('index', {title: 'Express'});
});


router.get('/territorium/worldfile', function (req, res, next) {
    let renderer = new Renderer();
    try {
        let xrot = 0;
        if (req.query.xrotation !== undefined)
            xrot = req.query.xrotation;

        let yrot = 0;
        if (req.query.yrotation !== undefined)
            yrot = req.query.yrotation;

        renderer.worldfile(req.query.long0, req.query.lat0, req.query.long1, req.query.lat1, xrot, yrot, req.query.width, req.query.height, function (file) {
            console.log(file);
        });
    } catch (e) {
        console.log(e);
    }
    res.render('index', {title: 'Express'});
});

module.exports = router;
