const express = require("express");
const authController = require('../controllers/auth');
const router = express.Router(); 
const multiparty = require('multiparty');
//const multipartparser = require('multipart-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//app.js랑 합침
// const path = require("path");
// const mysql = require("mysql");
// const dotenv = require("dotenv");
// dotenv.config({path : '../.env'});

const multer = require('multer');
const mul = multer({
    storage : multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'video/');
        },
        filename : function (req, file, cb) {
            let today = new Date();
            let milliseconds = today.getMilliseconds();
            cb(null, milliseconds + ".mp4");
            // insertpath = "/video/" + milliseconds + ".mp4";
        }
    })
});

const mul2 = multer({
    storage : multer.diskStorage({
        destination : function (req, file, cb) {
            cb(null, 'profileimg/');
        },
        filename : function (req, file, cb) {
            let today = new Date();
            let milliseconds = today.getMilliseconds();
            cb(null, milliseconds + ".png");
        }
    })
})


router.post('/register', mul2.single('uploadfile'), authController.register);
router.post('/login', authController.login);
router.post('/upload', authController.upload);
router.post('/videolist', authController.videolist);
router.post('/mypage', authController.mypage);
router.post('/revise', authController.revise);
router.post('/map', authController.map);
router.post('/mapp' , mul.single('uploadfile'), authController.mapp);
//router.post('/search', authController.search);
//router.post('/settings', authController.settings);

//업로드 페이지에서 공유버튼 눌렀을 때
//router.post('/play', mul.single('uploadfile'), authController.play);
//play버튼누르면
// router.post('/og', authController.og);

module.exports = router;
