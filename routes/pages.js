const express = require("express");
const router = express.Router(); 
var app = express();

router.get("/", (req, res) => {
    res.render('register');
})
//a href = "/login"만 html에 해주면 안되고 이것도 pages파일에 넣어줘야 함
router.get("/login", (req, res) => {
    res.render('login');
})

module.exports = router;