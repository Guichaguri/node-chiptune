var chiptune;
try {
    chiptune = require('node-chiptune');
} catch(e) {
    chiptune = require('../index.js');
}

const fs = require('fs');

// This example requires lame installed.
// Install it with "npm install lame"
const lame = require('lame');

// First of all, we will create a file readable stream. This is the tracker music
// "drozerix_-_mecanum_overdrive.xm" is the file name
var inputStream = fs.createReadStream('drozerix_-_mecanum_overdrive.xm');

// This is how we create the chiptune stream
// Let's not specify any options
var chiptuneDecoder = chiptune({
    channels: 4, // 4 channels to bypass a bug that causes choppy audio
    sampleRate: 48000 // 48,000 Hz sample rate
});

// Now we create the encoder. We will generate a mp3 of the chiptune
var lameEncoder = new lame.Encoder({
  // input
  channels: 2, // The input is actually 2 channels, don't let it fool you.
  bitDepth: 16, //16 bit PCM data
  sampleRate: 96000, //Double the sample rate to have normal speed

  // output
  bitRate: 128,
  outSampleRate: 48000, //Output back into the original sample rate
  mode: lame.STEREO //Output stero audio
});

// Let's create a file writable stream
// "drozerix_-_mecanum_overdrive.mp3" is the file name
var outputStream = fs.createWriteStream('drozerix_-_mecanum_overdrive.mp3');

// We should be able to pipe the file stream to the chiptune decoder
inputStream.pipe(chiptuneDecoder);
// the chiptune decoder to the lame encoder
chiptuneDecoder.pipe(lameEncoder);
// and finally the lame encoder to the output file
lameEncoder.pipe(outputStream);
