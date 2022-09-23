const mysql = require("mysql2");
const { request } = require("express");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {stat, createReadStream, createWriteStream, fstat, appendFile} = require('fs');
const {promisify} = require('util');
const multiparty = require('multiparty');
const bodyParser = require('body-parser');


const db = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE
});


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
                
                
                if(results.length > 0){ //비밀번호도 동일하면
                    // return res.render('map', { //로그인성공

                    //     // message: '로그인되었습니다'
                    // });
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

    db.query('select Name from buildingloc', async(error, results) => {

        var buildingname=[];
        for(var data of results){
            buildingname.push(data.Name);
        }
        //console.log(buildingname);
        res.render('upload', 
            {buildingname : buildingname});
    })
    
}

//마커 더보기 눌렀을 때 
exports.videolist = (req, res) => {

    const {location} = req.body;
    db.query('select PKey from buildingloc where Name = ?', [location], async(error, result) => {
        var pkey=[];
        for(var data of result){
            pkey.push(data.PKey);
        }

        db.query('select Path from Video where BuildingLocPKey = ?', [pkey], async(error, results) => {
            
            var videopath=[]; 
            for(var data of results){
                videopath.push(data.Path);
            }
            //console.log(videopath, location);
            return res.render('videolist', 
                {videopath : videopath, location : location});
        })
    })
}

exports.mypage = (req, res) => {
    const {location} = req.body;
    db.query('select NickName from buildingloc where Name = ?', [location], async(error, result) => {
    })
    return res.render('mypage');

}

exports.map = (req, res) => {
    return res.render('map')

}

exports.settings = (req, res) => {
    return res.render('settings')

}

//공유버튼 눌렀을 때 
//var fs = require('fs');
// exports.play = (req, res, next) => {
    
//     const location = req.body.loc;
//     const insertpath = "/video/" + req.file.filename; 
//     const filename = "./"+ insertpath;//전역변수에 저장...
//     module.exports = filename;
//     console.log(location, insertpath);
//     db.query('select PKey from buildingloc where Name = ?', [location], async(error, result) => {
//         var pkey=[];
//         for(var data of result){
//             pkey.push(data.PKey);
//         }
//         console.log(pkey);
//         db.query('insert into Video(BuildingLocPKey, Path) values(?,?)', [pkey, insertpath], async(error, results) => {
//             // var res = {size : req.file.size};
//             // res.json(size);
//             //console.log(req.file);
//             //res.set(‘Content-Type’, ‘text/plain’)
//             //console.log(type(req.file));
//             res.render('play'); //이렇게 말고 뒤로가기해서 지도로 가고 싶은데 이거는 어케함?ㅋㅋㅋㅋ
//         })
//     })
// }
