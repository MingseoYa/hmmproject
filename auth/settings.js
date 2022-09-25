var box2 = document.getElementById('box-setting');
// var map = document.getElementById('map');
var down = false;

function toggleSettings(){
    if (down) {
        box2.style.height = '0px';
        box2.style.zIndex = -1;
        box2.style.opacity = 0;
        down = false;
    }else {
        box2.style.height = '180px';
        box2.style.opacity = 1;
        box2.style.zIndex = 2;
        // box2.style.display = block;
        down = true;
    }
}