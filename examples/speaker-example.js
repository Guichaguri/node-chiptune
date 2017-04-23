var OpenMTP_Module;
try {
    OpenMTP_Module = require('node-chiptune');
} catch(e) {
    OpenMTP_Module = require('../index.js');
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
        
        // This is the module object, from which we will create a stream
        var module = new OpenMTP_Module(data);

        // You can optionally get and set some information about the track

        module.repeat_count = 10; // Make it repeat 10 times. Set it to -1 to repeat forever, 0 to play only one time.
        console.log('Position', module.position_seconds); // Position in seconds
        console.log('Repeat', module.repeat_count);
        console.log('Duration', module.duration_seconds); // Duration in seconds
        console.log('Instruments', module.num_instruments);
        console.log('Tempo', module.current_tempo);
        console.log('Speed', module.current_speed);
        console.log('Input Channels', module.num_channels);

        console.log(module.metadata);
        
        // This is how we create the chiptune stream
        // Let's not specify any options
        var chiptuneStream = module.openAsStream();
		
        // Now we create the Speaker
        var speakerStream = new Speaker();

        // We should be able to pipe the the chiptune stream to the speaker
		chiptuneStream.pipe(speakerStream);
        
        // Once we're done, just close the stream and the module
        chiptuneStream.on('close', function(){
			chiptuneStream.unpipe();
			chiptuneStream.destroy();
			module.destroy();
			module = null;
		})
    }
});
