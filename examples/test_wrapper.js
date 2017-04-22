OpenMTP_Module = require('../index.js');

const fs = require('fs');
const Speaker = require('speaker');

fs.readFile('alf2_zalza_edit.xm', function(err, data) {
    if(err != null) {
        console.log(err);
    } else {
        var module = new OpenMTP_Module(data);
        
        console.log(module)

        console.log('Position', module.position_seconds);
        console.log('Repeat', module.repeat);
        console.log('Duration', module.duration_seconds);
        console.log('Instruments', module.num_instruments);
        console.log('Tempo', module.current_tempo);
        console.log('Speed', module.current_speed);
        console.log('Input Channels', module.num_channels);

        console.log(module.metadata);
        
        var speakerStream = new Speaker();
        var chiptuneStream = module.openAsStream();
        chiptuneStream.pipe(speakerStream);
        
        chiptuneStream.on('close', function(){
			chiptuneStream.unpipe();
			chiptuneStream.destroy();
			module.destroy();
			module = null;
		})
    }
});
