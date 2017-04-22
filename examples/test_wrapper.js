OpenMTP_Module = require('../index.js');

const fs = require('fs');

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
    }
});
