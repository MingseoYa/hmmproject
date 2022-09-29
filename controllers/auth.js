const mysql = require("mysql");
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

var username;

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

    var pnu = [];//비디오 경로랑 계정주 같이 저장
    //var datapath;
    var datanickname;
    const {location} = req.body;
    db.query('select PKey from buildingloc where Name = ?', [location], async(error, result) => {
        var pkey=[];
        for(var data of result){
            pkey.push(data.PKey);
        }




        db.query('select Path from Video where BuildingLocPKey = ?', [pkey], async(error, results) => {
            for (var data of results){
                pnu.push(data.Path);
            }
       
            // for(var data of results){//한줄만 뽑히잖니:경로, 유저키
            //     //pnu.push([data.Path, data.UserPKey]); //경로저장하고..
                
            //     if(data.UserPKey != null){
            //         //datapath = data.Path;
            //         db.query('select Nickname from users where PKey = ?', [data.UserPKey], async(error, res) => {
            //             datapath = data.Path;
            //             for(var data2 of res){
                            
            //                 datanickname = data2.Nickname;
            //                 console.log(datanickname);
            //                 //datapath = data.Path;
            //                 console.log(datapath);
            //                 //console.log(datapath, datanickname);
            //                 pnu.push([datanickname, datapath]);
            //                 //console.log(pnu);
                            
            //             }
            //             //console.log(owner, location);
                    
            //         })

            //     }else{
            //         datanickname = ""
            //         pnu.push([datanickname, datapath]);
            //     }
                
            // }

            //console.log(pnu);
            //console.log(videopath, location);
            console.log(pnu);
            return res.render('videolist', 
                {location : location, pnu : pnu});
        })
    })
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
exports.revise =(req, res) => {
    res.render('revise');
}
exports.mypagere = (req, res) => {
    
    res.render('mypagere');

}