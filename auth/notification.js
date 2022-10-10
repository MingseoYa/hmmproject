var box = document.getElementById('box');
// var map = document.getElementById('map');
var down = false;

function toggleNotifi(){
    if (down) {
        box.style.height = '0px';
        box.style.zIndex = -1;
        box.style.opacity = 0;
        down = false;
    }else {
        box.style.height = '510px';
        box.style.opacity = 1;
        box.style.zIndex = 2;
        down = true;
    }
}

// 알림 띄우기
function notify(msg) {
    var options = {
        body: msg
    }
    // 데스크탑 알림 요청
    var notification = new Notification("DororongJu", options);
    // 3초뒤 알람 닫기
    setTimeout(function(){
        notification.close();
    }, 3000);}

//알림 권한 요청
function getNotificationPermission() {
    // 브라우저 지원 여부 체크
    if (!("Notification" in window)) {
        alert("데스크톱 알림을 지원하지 않는 브라우저입니다.");
    }
    // 데스크탑 알림 권한 요청
    Notification.requestPermission(function (result) {
        // 권한 거절
        if(result == 'denied') {
            alert('알림을 차단하셨습니다.\n브라우저의 사이트 설정에서 변경하실 수 있습니다.');
            return false;
        }
    });
}

// Notification.requestPermission();

// new Notification("타이틀", {body:'메세지 내용'});
