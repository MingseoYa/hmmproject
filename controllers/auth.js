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
var filename;
//var insertimgpath;

//회원가입버튼 눌렀을 때
exports.register = (req, res, next) => {
    //console.log(req.body);

    const { email, password, nickname } = req.body;
    if (!req.file){//사진선택을 안해줬다면 샘플프로필사진으로 넣어주기
        insertimgpath = "/image/sample_profile.jpg";
    }else{
        insertimgpath = "/profileimg/" + req.file.filename; //데베에 들어갈 경로

    }
    //filename = "./"+ insertpath;

    if(!email || !password || !nickname) {
        return res.render('register', {
            message: '정보가 입력되지 않았습니다'
        });
    }



    db.query('select Email from Users where Email = ?', [email], async(error, results) => {
        if(error){
            console.log(error);
        }

        if(results.length > 0){
            return res.render('register', {
                message : '이미 사용되고 있는 이메일입니다'
            });
        }

        db.query('select NickName from Users where NickName = ?', [nickname], async(error, results2) => {
            if(error) {
                console.log(error);
            }
            if(results2.length > 0){
                return res.render('register', {
                    message : '이미 사용되고 있는 닉네임입니다'
                });
            }
            console.log(results2);
            db.query('insert into Users set ?', {Email : email, Pwd: password, NickName: nickname, ProfileImg : insertimgpath}, (error, results) => {
                if(error) {
                    console.log(error);
                }else {
                    return res.render('register', {
                        message: '회원가입 되었습니다'
                    });
                    
                }
            })
        });


    });

}

//로그인버튼눌렀을 때
exports.login = (req, res) => {

    const { email, password } = req.body;


    db.query('select Email from Users where Email = ?', [email], async(error, results) => {
        if(error){
            console.log(error);
        }
        if(!email || !password) {
            return res.render('login', {
                message: '정보가 입력되지 않았습니다'
            });
        }

        if(results.length > 0){//이메일이 존재하면

            db.query('select Pwd from Users where Email = ? and Pwd = ?', [email, password], async(error, results) => {
                
                
                if(results.length > 0){ //비밀번호도 동일하면 로그인 성공
                    db.query('select NickName from Users where Email = ?', [email], async(error, resultss) => {
                        usernick = [];
                        for(var data of resultss){
                            usernick.push(data.NickName);
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
    const {longitude, latitude} = req.body;
   
        db.query('select Name, ST_DISTANCE_SPHERE(POINT(?, ?), gpsPoint) AS dist from buildingloc ORDER BY dist LIMIT 3',
        [longitude, latitude], async(error, results) => {

            var buildingname=[];
            for(var data of results){
                buildingname.push(data.Name);
                console.log(data.Name);
            }
            //console.log(buildingname);
            res.render('upload', 
                //{buildingname : buildingname}
                {buildingname : buildingname, username : username});
        })

    console.log(username);
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

    db.query('select PKey from BuildingLoc where Name = ?', [location], async(error, result) => {
        for(var data of result){
            bpkey.push(data.PKey);
        }

        db.query('select NickName, Path from Video, Users where Video.UserPKey = Users.PKey and Video.BuildingLocPKey = ?', [bpkey], async(error, results) => {

            for(var data of results){//한줄만 뽑히잖니';;;;;경로, 유저키
                //console.log(data);
                datapath = data.Path;
                datanickname = data.NickName;
                pnu.push(datanickname, datapath);

            }

            return res.render('videolist', 
                {location : location, pnu : pnu});

        })
    })
    
}


//공유버튼 눌렀을 때 
exports.mapp = (req, res, next) => {
    //username = req.body.username;
    var location = req.body.loc;
    var comment = req.body.comment;
    //console.log(location);
    var insertpath = "/video/" + req.file.filename; //데베에 들어갈 경로
    filename = "./"+ insertpath;

    //사용자key
    var upkey=[];
    //console.log(username, insertpath, location);
    db.query('select PKey from Users where NickName = ?', [username], async(error, result) => {
      for(var data of result){
        upkey.push(data.PKey);
      }
    })
    db.query('select PKey from BuildingLoc where Name = ?', [location], async(error, result) => {
        var pkey=[];
        for(var data of result){
            pkey.push(data.PKey);
        }
        //console.log(pkey);
        db.query('insert into Video(UserPKey, BuildingLocPKey, Path, Comment) values(?,?,?,?)', [upkey[0], pkey, insertpath, comment], async(error, results) => {
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
    var imgpaths = [];

    db.query('select PKey, ProfileImg from Users where NickName = ?', [username], async(error, result) => {
        var pkey2=[];
        for(var data of result){
            pkey2.push(data.PKey);
            if (data.ProfileImg == null){
                imgpaths.push("/image/sample_profile.jpg");
            }
            else{
                imgpaths.push(data.ProfileImg);
            }
            
        }

        db.query('select Path from Video where UserPKey = ?', [pkey2], async(error, result) => {
        
            for(var data2 of result){
                paths.push(data2.Path);
            }
        });
    });    

    return res.render('mypage', {
        username : username, paths : paths, imgpaths : imgpaths
    });
}

exports.map = (req, res) => {
    res.render('map');

}

exports.revise = (req, res) => {
    var imgpaths = [];

    db.query('select ProfileImg from users where NickName = ?', [username], async(error, result) => {
        var pkey2=[];
            for(var data of result){
                pkey2.push(data.PKey);

                if (data.ProfileImg == null){
                    imgpaths.push("/image/sample_profile.jpg");
                }
                else{
                    imgpaths.push(data.ProfileImg);
                }
            }
            console.log(imgpaths);
    });
    res.render('revise', {
        username : username
    });
}
exports.mypagere = (req, res) => {
    const {nickname, uploadfile} = req.body;
    var paths=[];
    var imgpaths=[];

    db.query('update users set NickName = ? where NickName = ?', [nickname, username], async(error, results) => {
        username = nickname
        console.log(username);
        db.query('update users set ProfileImg = ? where NickName = ?', [uploadfile, username], async(error, result) => {
            var pkey2=[];
            for(var data of result){
                pkey2.push(data.PKey);

                if (data.ProfileImg == null){
                    imgpaths.push("/image/sample_profile.jpg");
                }
                else{
                    imgpaths.push(data.ProfileImg);
                }
            }
            console.log(imgpaths);
            

            db.query('select Path from Video where UserPKey = ?', [pkey2], async(error, results) => {
            
                for(var data2 of results){
                    paths.push(data2.Path);
                }
                res.render('mypage', {
                    username : username, paths : paths, imgpaths : imgpaths
                });
            });
        });
    });


}

//검색버튼 눌렀을 때
// function searchvideo() {
//     var searchword = document.getElementById("search-input").value;
//     //str = ""
//     videos.innerText = searchword;
//     console.log(searchword);
    
//     db.query('select Path, Comment from Video' , async(error, result) => {
//         var comment = "";
//         var videopath = [];
//         for(var data of result){
//             comment.push(data.Comment.split('#'));
//             if(comment.includes(searchword)){
//                 videopath.push(data.Path);

//             }
//         }
//         console.log(videopath);

//     });

//  }