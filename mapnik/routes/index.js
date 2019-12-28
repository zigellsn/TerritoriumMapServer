const express = require('express');
const Renderer = require('../renderer/renderer');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    let renderer = new Renderer();
    try {
        renderer.worldfile(9.15, 48.7, 9.16, 48.8, 0, 0, 256, 256, function (file) {
            console.log(file);
        });
        renderer.map(9.15, 48.7, 9.16, 48.8, 0, 0, 256, 256, 'png', function (file) {
        });
    } catch (e) {
        console.log(e);
    }
    res.render('index', {title: 'Express'});
});

module.exports = router;
