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
        
        /*
        var speakerStream = new Speaker();
        var chiptuneStream = module.openAsStream();
        chiptuneStream.pipe(speakerStream);
        
        
        chiptuneStream.on('close', function(){
			chiptuneStream.unpipe();
			chiptuneStream.destroy();
			module.destroy();
			module = null;
		})
		*/
		
		for(var order = module.current_order; order < module.num_orders; order++) {
			const pattern = module.get_order_pattern(order);
			for(var row = 0; row < module.get_pattern_num_rows(pattern); row++) {
				module.set_position_order_row(order, row);
				var channelUpdates = [];
				for(var channel = 0; channel < module.num_channels; channel++) {
					channelUpdates.push(module.get_pattern_row_channel(pattern, row, channel))
				}
				var rowString = "";
				channelUpdates.forEach(function(update, idx){
					if(idx !== 0) rowString += " | ";
					rowString += update.string;
				})
				console.log(rowString)
			}
		}
    }
});
