// let enableBtn;
let note = "";
let noteSpan;

function setup() {
  createCanvas(0, 0);
  getAudioContext().resume();
  // enableBtn = createButton('Enable Mic');
  // enableBtn.mousePressed(toggleLiveInput);
  toggleLiveInput();
  noteSpan = select('#pitch');
  // textSize(48);
}

var appear = false;
function draw() {
  background(220);

  
  if (noteSpan.html() != "-") {
    note = noteSpan.html();
    // console.log(note);
    // text(note, 200, 200);
    if(note>=10000 && note<27000){
      // console.log('level1');
      console.log(note);
      
    } 

  }

}