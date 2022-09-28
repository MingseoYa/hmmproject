const express = require("express");
const authController = require('../controllers/auth');
const router = express.Router(); 
const multiparty = require('multiparty');
//const multipartparser = require('multipart-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//app.js랑 합침
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config({path : '../.env'});

const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
  });

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
var username;
var filename;

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/upload', authController.upload);
router.post('/videolist', authController.videolist);
router.post('/mypage', authController.mypage);
router.post('/map', authController.map);
router.post('/settings', authController.settings);
router.post('/mapp' ,mul.single('uploadfile'), (req, res, next) => {
    username = req.body.username;
    const location = req.body.loc;
    console.log(location);
    const insertpath = "/video/" + req.file.filename; 
    filename = "./"+ insertpath;
    console.log(location, insertpath);
    var upkey=[];
    console.log(username, insertpath, location);
    //사용자 pkey가져오기
    db.query('select PKey from users where Nickname = ?', [username], async(error, result) => {
      for(var data of result){
        upkey.push(data.PKey);
      }
    })
    db.query('select PKey from buildingloc where Name = ?', [location], async(error, result) => {
        var pkey=[];
        for(var data of result){
            pkey.push(data.PKey);
        }
        console.log(pkey);
        db.query('insert into Video(UserPKey, BuildingLocPKey, Path) values(?,?,?)', [upkey[0], pkey, insertpath], async(error, results) => {
            // var res = {size : req.file.size};
            // res.json(size);
            //console.log(req.file);
            //res.set(‘Content-Type’, ‘text/plain’)
            //console.log(type(req.file));
            res.render('map');
        })
    })
});
//업로드 페이지에서 공유버튼 눌렀을 때
//router.post('/play', mul.single('uploadfile'), authController.play);
//play버튼누르면
// router.post('/og', authController.og);

module.exports = router;
