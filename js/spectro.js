window.requestAnimationFrame = function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		function(f) {
			window.setTimeout(f,1e3/60);
		}
}();

navigator.getUserMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

//Canvas and animation variables
var c = document.getElementById("canvas");
var canvasCtx= c.getContext("2d");

var fps = 12;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

//Audio Context Variables
var audioCtx = new (window.AudioContext || window.webkitAudioContext)() ;
var analyser = audioCtx.createAnalyser();

var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var dataGlob;

//Get audio input through microphone
try {
	navigator.getUserMedia(
          { video: false,
            audio: true},
          setupAudioNodes,
          errorFunction);
} catch (e) {
    console.log('webkitGetUserMedia threw exception :' + e);
    alert("Could not start getUserMedia");
}

//Function called when streaming is succesfull
function setupAudioNodes(stream) {
    sourceNode = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();

    //Setup Analyser
    analyser.fftSize = 2048;
	sourceNode.connect(analyser);

}

//called on getUserMedia error
function errorFunction (e) {
    console.log(e);
}

function drawSpectro(){
	bufferSize = analyser.frequencyBinCount;
	var data = new Float32Array(bufferSize); 
	analyser.getFloatFrequencyData(data);
	
	var peaks = getPeaks(data, -60)
	peaks = peaks[1];
	
	var binWidth = 1;//Math.floor(c.width / (data.length/2));
	var HEIGHT_MULT = 5;
	var xOffset = 40;
	var yOffset = c.height - 20;
	var bin2Freq = audioCtx.sampleRate/2/bufferSize		//Factor to convert bin to frequency

	for (var i = 0; i < data.length; i++){
		var barHeight = (100 + data[i]) * -1 * HEIGHT_MULT;

		if(peaks.indexOf(i) != -1) {
			var freq = (i * bin2Freq).toFixed(1);	//With no interpolation
			canvasCtx.fillStyle = "red";
			canvasCtx.font="8px Verdana";
			canvasCtx.fillText(freq + "Hz", i + 5 + xOffset, c.height + barHeight - 7);	
		}

		canvasCtx.fillRect(i + xOffset, yOffset, binWidth, barHeight);
		canvasCtx.fillStyle = "black";
	}

	//Leyends
	canvasCtx.fillStyle = "white";
	canvasCtx.fillRect(0, yOffset, c.width, yOffset + c.height);	//Clean space beneath offset
	
	canvasCtx.fillStyle = "black";
	canvasCtx.font="10px Verdana";
	
	//Horizontal
	for (var i = xOffset; i < c.width; i+=50) {
		var freq = Math.round((i - xOffset + 1) * bin2Freq);
		
		canvasCtx.fillRect(i, yOffset, 1, 5);
		canvasCtx.fillText(freq, i - 10, yOffset + 15);		
	}

	//Vertical
	for(var i = yOffset; i > 0; i-=50){
		var dBs = Math.round(-(i * 100 / yOffset));
		canvasCtx.fillRect(xOffset, i, -5, 1);
		canvasCtx.fillText(dBs, 12, i + 5);
	}

	dataGlob = data;
	
}


//Looping function to redraw and recalculate.
function update(){

	now = Date.now();
	delta = now - then;
	//console.log(delta);
	
	if (delta > interval) {
		
		canvasCtx.clearRect(0, 0, c.width, c.height);
		
		drawSpectro();
		
		then = now - (delta % interval);

	}

	window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);
