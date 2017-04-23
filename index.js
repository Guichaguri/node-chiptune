const stream = require('stream');
const native = require('./libopenmpt.js');

module.exports = OpenMPT_Module;

function OpenMPT_Module(fileData) {
	this.mod_ptr = openModule(fileData);
}

OpenMPT_Module.prototype = {
	get repeat_count() {
		return native._openmpt_module_get_repeat_count(this.mod_ptr);
	},
	set repeat_count(count) {
		native._openmpt_module_set_repeat_count(this.mod_ptr, count);
	},
	get position_seconds() {
		return native._openmpt_module_get_position_seconds(this.mod_ptr);
	},
	set_position_seconds: function(seconds) {
		return native._openmpt_module_set_position_seconds(this.mod_ptr, seconds);
	},
	set_position_order_row: function(orderId, rowId) {
		return native._openmpt_module_set_position_order_row(this.mod_ptr, orderId, rowId);
	},
	get duration_seconds() {
		return native._openmpt_module_get_duration_seconds(this.mod_ptr);
	},
	get current_speed() {
		return native._openmpt_module_get_current_speed(this.mod_ptr);
	},
	get current_tempo() {
		return native._openmpt_module_get_current_tempo(this.mod_ptr);
	},
	get current_pattern() {
		return native._openmpt_module_get_current_pattern(this.mod_ptr);
	},
	get current_row() {
		return native._openmpt_module_get_current_row(this.mod_ptr);
	},
	get current_order() {
		return native._openmpt_module_get_current_order(this.mod_ptr);
	},
	get num_channels() {
		return native._openmpt_module_get_num_channels(this.mod_ptr);
	},
	get num_instruments() {
		return native._openmpt_module_get_num_instruments(this.mod_ptr);
	},
	get num_orders() {
		return native._openmpt_module_get_num_orders(this.mod_ptr);
	},
	get num_patterns() {
		return native._openmpt_module_get_num_patterns(this.mod_ptr);
	},
	get num_samples() {
		return native._openmpt_module_get_num_samples(this.mod_ptr);
	},
	get num_subsongs() {
		return native._openmpt_module_get_num_subsongs(this.mod_ptr);
	},
	get_pattern_num_rows: function(patternId) {
		return native._openmpt_module_get_pattern_num_rows(this.mod_ptr, patternId);
	},
	get_pattern_row_channel: function(patternId, rowId, channelId) {
		const mod_ptr = this.mod_ptr;
		const get_command = native._openmpt_module_get_pattern_row_channel_command.bind(native, mod_ptr, patternId, rowId, channelId)
		
		const data = {
			note: get_command(0),
			instrument: get_command(1),
			volumeEffect: get_command(2),
			effect: get_command(3),
			volume: get_command(4),
			parameter: get_command(5),
			string: native.Pointer_stringify(native._openmpt_module_format_pattern_row_channel(mod_ptr, patternId, rowId, channelId, 16, 0))
		}
		
		return data;
	},
	get_order_pattern: function(orderId) {
		return native._openmpt_module_get_order_pattern(this.mod_ptr, orderId);
	},
	select_subsong: function(subsongId) {
		return native._openmpt_module_select_subsong(this.mod_ptr, subsongId);
	},
	get metadata() {
		const metadata = {};
		const keys = native.Pointer_stringify(native._openmpt_module_get_metadata_keys(this.mod_ptr)).split(';');
		for(var i = 0; i < keys.length; i++) {
			var buf = native._malloc(keys[i].length + 1);
			native.writeStringToMemory(keys[i], buf);
			metadata[keys[i]] = native.Pointer_stringify(native._openmpt_module_get_metadata(this.mod_ptr, buf));
			native._free(buf);
		}
		return metadata;
	}
}

class ModuleStream extends stream.Readable {	
	constructor(module, channels, samplerate, maxFramesPerChunk) {
		if(channels != 1 && channels != 2 && channels != 4) {
			throw new Error('Invalid number of channels');
		}
		
		const bytesPerFrame = 2 * channels;
		
		const options = {
			read: function() {
				if(this.destroyed) {
					this.push(null);
					return;
				}
				const buf = readModule(module.mod_ptr, this.buf_ptr, samplerate, channels, maxFramesPerChunk, bytesPerFrame);
				if(buf == null) {
					native._free(this.buf_ptr);
				}
				this.push(buf);
			}
		}
		
		super(options) // `this` only defined after this point
		
		this.buf_ptr = initBuffer(maxFramesPerChunk, bytesPerFrame);
		this.destroyed = false;
	}
	
	destroy() {
		this.destroyed = true;
		native._free(this.buf_ptr);
	}
}

// Default values match those of node-speaker
OpenMPT_Module.prototype.openAsStream = function(channels = 2, samplerate = 44100, maxFramesPerChunk = 1024) {
	return new ModuleStream(this, channels, samplerate, maxFramesPerChunk);
}

OpenMPT_Module.prototype.destroy = function () {
	native._openmpt_module_destroy(this.mod_ptr);
	this.mod_ptr = null;
	delete this.mod_ptr;
}

function openModule(fileData) {
    var array = new Int8Array(fileData);
    var allocMem = native._malloc(array.byteLength);
    native.HEAPU8.set(array, allocMem);

    return native._openmpt_module_create_from_memory(allocMem, array.byteLength, 0, 0, 0);
}

function initBuffer(bytesPerFrame, maxFramesPerChunk) {
    return native._malloc(bytesPerFrame * maxFramesPerChunk);
}

function readModule(mod_ptr, buf_ptr, samplerate, channels, maxFramesPerChunk, bytesPerFrame) {
    var frames = 0;
    switch(channels) {
        case 1:
            frames = native._openmpt_module_read_mono(mod_ptr, samplerate, maxFramesPerChunk, buf_ptr);
            break;
        case 2:
            frames = native._openmpt_module_read_interleaved_stereo(mod_ptr, samplerate, maxFramesPerChunk, buf_ptr);
            break;
        case 4:
            frames = native._openmpt_module_read_interleaved_quad(mod_ptr, samplerate, maxFramesPerChunk, buf_ptr);
            break;
    }

    if(frames <= 0) return null;

    var rawpcm = native.HEAPU8.subarray(buf_ptr, buf_ptr + bytesPerFrame * frames);

    return new Buffer(rawpcm.buffer).slice(rawpcm.byteOffset, rawpcm.byteOffset + rawpcm.byteLength);
}

function cleanupModule(mod_ptr, buf_ptr) {
    native._free(buf_ptr);
    native._openmpt_module_destroy(mod_ptr);
}
