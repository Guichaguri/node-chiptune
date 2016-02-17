var chiptune;
try {
    chiptune = require('node-chiptune');
} catch(e) {
    chiptune = require('../index.js');
}

const fs = require('fs');

// This example requires speaker installed.
// Install it with "npm install speaker"
const Speaker = require('speaker');


// First of all, we will create a file stream
// "drozerix_-_mecanum_overdrive.xm" is the file name
fs.readFile('drozerix_-_mecanum_overdrive.xm', function(err, data) {
    if(err != null) {
        // Lets handle errors if we got any
        console.log(err);
    } else {
        // This is how we create the chiptune stream
        // Let's not specify any options
        var chiptuneStream = chiptune(data);

        // You can optionally get and set some information about the track

        //chiptuneStream.position = 10; // Changes the position to 10 seconds
        chiptuneStream.repeat = 10; // Make it repeat 10 times. Set it to -1 to repeat forever, 0 to play only one time.
        console.log('Position', chiptuneStream.position); // Position in seconds
        console.log('Repeat', chiptuneStream.repeat);
        console.log('Duration', chiptuneStream.duration); // Duration in seconds
        console.log('Instruments', chiptuneStream.num_instruments);
        console.log('Tempo', chiptuneStream.current_tempo);
        console.log('Speed', chiptuneStream.current_speed);
        console.log('Input Channels', chiptuneStream.num_channels);

        console.log(chiptuneStream.metadata);

        // Now we create the Speaker
        var speakerStream = new Speaker();

        // We should be able to pipe the the chiptune stream to the speaker
        chiptuneStream.pipe(speakerStream);
    }
});
