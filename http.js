const {createServer} = require('http');
const {stat, createReadStream, createWriteStream, fstat} = require('fs');
const {promisify} = require('util');
const express = require('express');
const multiparty = require('multiparty');
//const multipartparser = require('multipart-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//app.js랑 합침
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config({path : './.env'});

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


// //gps
// const exiftool = require('node-exiftool');
// const ep = new exiftool.ExiftoolProcess('./exiftool(-k).exe');


var fileName;
var username;

// const fs = require('fs');

// const videoData=fs.readFileSync('file.txt', {encoding:'utf8',flag:'r'});
// console.log(videoData[1]);
// const filename = './copy/newVid.webm';
// const filename = './anime_dancing.mp4';
// const filename = './copy/2022620249_53_165'+'.mp4';

var filename;
const fileInfo = promisify(stat);

const sendOGVideo = async (req, res) => {
  //var filename = "./video/325.mp4";
  //console.log(filename);
  const {size} = await fileInfo(filename);
  const range = req.headers.range;
  if(range){
    let [start, end] = range.replace(/bytes=/, '').split('-');
    start = parseInt(start, 10);
    end = end ? parseInt(end, 10) : size-1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': (start-end) + 1,
      'Content-Type': 'video/mp4'
    })

    createReadStream(filename, {start, end}).pipe(res);
  }else{
    res.writeHead(200, {
      'Content-Length': size,
      'Content-Type': 'video/mp4'
    });  
    createReadStream(filename).pipe(res);
  }
};


var app = express(); 
var fs = require('fs');


//video로 영상저장
app.post('/play', mul.single('uploadfile'), function (req, res, next){

  // let today = new Date();   
  // let year = today.getFullYear(); // 년도
  // let month = today.getMonth() + 1;  // 월
  // let date = today.getDate();  // 날짜
  // // let day = today.getDay();  
  // let hours = today.getHours(); // 시
  // let minutes = today.getMinutes();  // 분
  // let seconds = today.getSeconds();  // 초
  // let milliseconds = today.getMilliseconds(); // 밀리초

  // let form = new multiparty.Form();

  // fileName = "./video/" + milliseconds + ".mp4";
  // filename = fileName;
  // form.on('part', (part) =>{
  //   part
  //     // .pipe(createWriteStream(`./copy/${part.filename}`))
  //     // .pipe(createWriteStream('./copy/'+year+month+date+hours+minutes + '_' + seconds + '_' + milliseconds+'.mp4'))
  //     .pipe(createWriteStream(fileName))
  //     .on('close', () => {
  //       fs.readFile('./play.html', function(err, data) {
  //         res.writeHead(200, {'Content-Type': 'text/html'});
  //         return res.end(data);
  //     });
  //     })
  // })
  // form.parse(req);
    username = req.body.username;
    const location = req.body.loc;
    console.log(location);
    const insertpath = "/video/" + req.file.filename; 
    filename = "./"+ insertpath;
    console.log(location, insertpath);
    var upkey=[];
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
            res.render('play');
        })
    })
});



//connect mysql
const db = mysql.createConnection({
  host : process.env.DATABASE_HOST,
  user : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE
});
// db.connect( (error) => {
//   if(error) {
//       console.log(error)
//   }else{
//       console.log("MYSQL Connected...")
//   }
// });



//connect routes/auth to load login and register pages
const publicDirectory = path.join(__dirname, './start'); //css,javascript파일등..
app.use(express.static(publicDirectory));//express가 path사용하도록

app.use(express.urlencoded({ extended : false }));
app.use(express.json());

app.set('view engine', 'hbs');
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use(express.static('./'));


app.get('/og', function (req, res){
  sendOGVideo(req, res);
});

app.listen(5050, function(){
  console.log('server running on port5050');
});
