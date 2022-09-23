const express = require("express");
const authController = require('../controllers/auth');
const router = express.Router(); 


// const multer = require('multer');
// const mul = multer({
//     storage : multer.diskStorage({
//         destination: function (req, file, cb) {
//             cb(null, 'video/');
//         },
//         filename : function (req, file, cb) {
//             let today = new Date();
//             let milliseconds = today.getMilliseconds();
//             cb(null, milliseconds + ".mp4");
//             // insertpath = "/video/" + milliseconds + ".mp4";
//         }
//     })
// });


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/upload', authController.upload);
router.post('/videolist', authController.videolist);
router.post('/mypage', authController.mypage);
router.post('/map', authController.map);
router.post('/settings', authController.settings);
//업로드 페이지에서 공유버튼 눌렀을 때
//router.post('/play', mul.single('uploadfile'), authController.play);
//play버튼누르면
// router.post('/og', authController.og);

module.exports = router;