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
    console.log(longitude + ", " + latitude);
   
        db.query('select Name, ST_DISTANCE_SPHERE(POINT(?, ?), gpsPoint) AS dist from BuildingLoc ORDER BY dist LIMIT 3',
        [longitude, latitude], async(error, results) => {

        var buildingname=[];
        for(var data of results){
            buildingname.push(data.Name);
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

    var {location} = req.body; //건물정보 가져오기

    var bpkey = []; //해당건물이름 하나 저장
    var datapath; //영상 경로
    var datanickname; //닉네임
    var profileImg; //프로필이미지 경로
    var comment; //태그
    var pnu = [];//경로랑 유저닉네임 같이 저장

    db.query('select PKey from BuildingLoc where Name = ?', [location], async(error, result) => {
        for(var data of result){
            bpkey.push(data.PKey);
        }

        db.query('select NickName, Path, Users.ProfileImg, Video.Comment from Video, Users where Video.UserPKey = Users.PKey and Video.BuildingLocPKey = ?', [bpkey], async(error, results) => {

            for(var data of results){//한줄만 뽑히잖니';;;;;경로, 유저키
                //console.log(data);
                datapath = data.Path;
                datanickname = data.NickName;
                profileImg = data.ProfileImg;
                comment = data.Comment;
                pnu.push(profileImg, datanickname, datapath, comment);
            }

            return res.render('videolist', 
                {location : location, pnu : pnu});

        })
        
    })
    
}


//공유버튼 눌렀을 때 
exports.mapp = (req, res, next) => {

    var location = req.body.loc;
    var comment = req.body.comment;
    var sound = req.body.sound; //게시물인지 사운드태그인지
    console.log(sound);

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
        
        //updatetype도 들어가도록 추가
        db.query('insert into Video(UserPKey, BuildingLocPKey, Path, Comment, UploadType) values(?,?,?,?,?)', [upkey[0], pkey, insertpath, comment, sound], async(error, results) => {

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
            //console.log(paths);
            res.render('mypage', {
                username : username, paths : paths, imgpaths : imgpaths
            });
        });
    });    


}

exports.friendProfile = (req, res) => {
    var paths=[];
    var imgpaths = [];
    var username;
    const {friendname} = req.body;
    db.query('select PKey, ProfileImg from Users where NickName = ?', [friendname], async(error, result) => {
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
            //console.log(paths);
            res.render('mypage', {
                username : friendname, paths : paths, imgpaths : imgpaths
            });
        });
    });    


}

exports.map = (req, res) => {
    res.render('map');
}

exports.revise = (req, res) => {
    imgpaths = [];

    db.query('select ProfileImg from Users where NickName = ?', [username], async(error, result) => {
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
    });
    res.render('revise', {
        username : username, imgpaths : imgpaths
    });
}

exports.mypagere = (req, res, next) => {
    // const {nickname} = req.body;
    var nickname = req.body.nickname;
    var paths=[];
    var imgpaths=[];

    db.query('update Users set NickName = ? where NickName = ?', [nickname, username], async(error, results) => {
        username = nickname
        console.log(username);


    });
    if(req.file != null){
        insertimgpath = "/profileimg/" + req.file.filename; //데베에 들어갈 경로
        db.query('update Users set ProfileImg = ? where NickName = ?', [insertimgpath, username], async(error, result) => {            
        });
    }
    
    db.query('select PKey, ProfileImg from Users where nickname = ?', [nickname], async(error, result1) =>{
        var pkey2 =[];
        for(var data of result1){
            pkey2.push(data.PKey);
            imgpaths.push(data.ProfileImg);
        }
        db.query('select Path from Video where UserPKey = ?', [pkey2], async(error, results) => {
    
            for(var data2 of results){
                paths.push(data2.Path);
            }
            res.render('mypage', {
                username : username, paths : paths, imgpaths : imgpaths
            });
        });
    });


}

exports.search = (req, res) => {
    const {word} = req.body;
    console.log(word);

    var videopath = [];
    //게시글로 올린것만 나오도록하기!!!!!!
    db.query('select Path, Comment from Video where updateType = 1', async(error, result) => {
        
        for(var data of result) {
            if (data.Comment != null){
                if (data.Comment.includes(word)){
                videopath.push(data.Path);
                }
            }
        }
        console.log(videopath);
        res.render("searchvideo", {
            word : word, videopath : videopath
        })
    })
}


//map에서 tag버튼을 눌렀을 때
exports.soundlist = (req, res) => {
    const {sound} = req.body; //sound는 1,2,3,4
    console.log(sound);
    var pnu = [];//경로랑 유저닉네임 같이 저장

    // const {sound} = req.body;
    // res.render("soundlist",{sound : sound})
    // console.log("auth" + sound);

    

    db.query('select NickName, Path from Video, Users where Video.UserPKey = Users.PKey and Video.UpdateType = ?', [sound], async(error, results) => {

        for(var data of results){//한줄만 뽑히잖니';;;;;경로, 유저키
            //console.log(data);
            datapath = data.Path;
            datanickname = data.NickName;
            pnu.push(datanickname, datapath);

        }
        //console.log(sound);

        return res.render('soundlist', 
            {pnu : pnu, sound : sound});

    })

}
