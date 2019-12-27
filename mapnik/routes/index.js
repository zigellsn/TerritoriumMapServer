const express = require('express');
const Renderer = require('../renderer/renderer');
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    let renderer = new Renderer();
    try {
        renderer.worldfile(0, 0, 1, 1, 0, 0, 256, 256);
    } catch (e) {
        console.log(e);
    }
    res.render('index', {title: 'Express'});
});

module.exports = router;
