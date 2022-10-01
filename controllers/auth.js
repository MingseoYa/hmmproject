const mysql = require("mysql2");
const { request } = require("express");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {stat, createReadStream, createWriteStream, fstat, appendFile} = require('fs');
const {promisify} = require('util');
const multiparty = require('multiparty');
const bodyParser = require('body-parser');

// const multer = require('multer');
// const mul = multer({
//     storage : multer.diskStorage({
//         destination: function (req, file, cb) {
//             cb(null, 'video/');//계정 다시 한번 보기
//         },
//         filename : function (req, file, cb) {
//             let today = new Date();
//             let milliseconds = today.getMilliseconds();
//             cb(null, milliseconds + ".mp4");
//             // insertpath = "/video/" + milliseconds + ".mp4";
//         }
//     })
// });

const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
});

var username;
var filename;

//회원가입버튼 눌렀을 때
exports.register = (req, res) => {
    //console.log(req.body);

    const { email, password, nickname } = req.body;

    if(!email || !password || !nickname) {
        return res.render('register', {
            message: '정보가 입력되지 않았습니다'
        });
    }



    db.query('select Email from users where Email = ?', [email], async(error, results) => {
        if(error){
            console.log(error);
        }

        if(results.length > 0){
            return res.render('register', {
                message : '이미 사용되고 있는 이메일입니다'
            });
        }

        //비밀번호 해쉬
        // let hashedPassword = await bcrypt.hash(password, 8);
        // console.log(hashedPassword);

        db.query('insert into users set ?', {Email : email, Pwd: password, Nickname: nickname}, (error, results) => {
            if(error) {
                console.log(error);
            }else {
                return res.render('register', {
                    message: '회원가입 되었습니다'
                });
                
            }
        })
    });

}

//로그인버튼눌렀을 때
exports.login = (req, res) => {

    const { email, password } = req.body;


    db.query('select Email from users where Email = ?', [email], async(error, results) => {
        if(error){
            console.log(error);
        }
        if(!email || !password) {
            return res.render('login', {
                message: '정보가 입력되지 않았습니다'
            });
        }

        if(results.length > 0){//이메일이 존재하면

            db.query('select Pwd from users where Email = ? and Pwd = ?', [email, password], async(error, results) => {
                
                
                if(results.length > 0){ //비밀번호도 동일하면 로그인 성공
                    db.query('select Nickname from users where Email = ?', [email], async(error, resultss) => {
                        usernick = [];
                        for(var data of resultss){
                            usernick.push(data.Nickname);
                        }
                        username = usernick[0];
                        
                    })
                    return res.render('map');
                }else{//비밀번호 불일치
                    
                    return res.render('login', {     
                        message: '비밀번호를 다시 입력하세요'
                    })
                }
            })

        }else{//일치하는 이메일이 없음

            return res.render('login', {
                message: '일치하는 이메일이 없습니다'
            })
        }
    });
}

//when click + button
exports.upload = (req, res) => {
    console.log(username);

    db.query('select Name from buildingloc', async(error, results) => {

        var buildingname=[];
        for(var data of results){
            buildingname.push(data.Name);
        }
        //console.log(buildingname);
        res.render('upload', 
            //{buildingname : buildingname}
            {buildingname : buildingname, username : username});
    })
    
}

//마커 더보기 눌렀을 때 
exports.videolist = (req, res) => {

    //var pnu = [];//비디오 경로랑 계정주 같이 저장하려고
    //var datapath;
    //var datanickname;
    var {location} = req.body; //건물정보 가져오기

    var bpkey = []; //해당건물이름 하나 저장
    var datapath;
    var datanickname;
    var pnu = [];//경로랑 유저닉네임 같이 저장

    db.query('select PKey from buildingloc where Name = ?', [location], async(error, result) => {
        for(var data of result){
            bpkey.push(data.PKey);
        }

        db.query('select Nickname, Path from Video,users where Video.UserPKey = users.Pkey and Video.BuildingLocPKey = ?', [bpkey], async(error, results) => {

            for(var data of results){//한줄만 뽑히잖니';;;;;경로, 유저키
                //console.log(data);
                datapath = data.Path;
                datanickname = data.Nickname;
                pnu.push(datanickname, datapath);

            }
            console.log(pnu);

            return res.render('videolist', 
                {location : location, pnu : pnu});

        })
    })
    
}


//공유버튼 눌렀을 때 
exports.mapp = (req, res, next) => {
    //username = req.body.username;
    var location = req.body.loc;
    //console.log(location);
    var insertpath = "/video/" + req.file.filename; //데베에 들어갈 경로
    filename = "./"+ insertpath;

    //사용자key
    var upkey=[];
    //console.log(username, insertpath, location);
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
        //console.log(pkey);
        db.query('insert into Video(UserPKey, BuildingLocPKey, Path) values(?,?,?)', [upkey[0], pkey, insertpath], async(error, results) => {
            // var res = {size : req.file.size};
            // res.json(size);
            //console.log(req.file);
            //res.set(‘Content-Type’, ‘text/plain’)
            //console.log(type(req.file));
            res.render('map');
        })
    })
}

exports.mypage = (req, res) => {


    var paths=[];
    db.query('select PKey from users where NickName = ?', [username], async(error, result) => {
        var pkey2=[];
        for(var data of result){
            pkey2.push(data.PKey);
        }
        console.log(pkey2);
        db.query('select Path from video where UserPKey = ?', [pkey2], async(error, result) => {
        
            for(var data2 of result){
                paths.push(data2.Path);
            }
            console.log(paths);
        });
    });
    

    
    
    return res.render('mypage', {
        username : username, paths : paths
    });
}

exports.map = (req, res) => {
    res.render('map');

}
exports.revise = (req, res) => {

    res.render('revise', {
        username : username
    });
}
exports.mypagere = (req, res) => {
    
    res.render('mypagere');

}