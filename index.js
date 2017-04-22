const stream = require('stream');
const native = require('./libopenmpt.js');

module.exports = OpenMPT_Module;

function OpenMPT_Module(fileData) {
	this.mod_ptr = openModule(fileData);
}

OpenMPT_Module.prototype = {
	get repeat() {
		return native._openmpt_module_get_repeat_count(this.mod_ptr);
	},	
	set repeat(count) {
		native._openmpt_module_set_repeat_count(this.mod_ptr, count);
	},	
	get position_seconds() {
		return native._openmpt_module_get_position_seconds(this.mod_ptr);
	},
	set position_seconds(seconds) {
		native._openmpt_module_set_position_seconds(this.mod_ptr, seconds);
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
	get num_channels() {
		return native._openmpt_module_get_num_channels(this.mod_ptr);
	},	
	get num_instruments() {
		return native._openmpt_module_get_num_instruments(this.mod_ptr);
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
	},
	destroy: function () {
		native._openmpt_module_destroy(this.mod_ptr);
		this.mod_ptr = null;
		delete this.mod_ptr;
	}
}

function openModuleAsStream(buffer, options) {
    const hasOptions = options != null && typeof options == 'object';
    const duplex = buffer == null || !Buffer.isBuffer(buffer);

    if(duplex && !hasOptions && typeof buffer == 'object') {
        options = buffer;
    } else if(!hasOptions) {
        options = {};
    }

    const samplerate = options['sampleRate'] || 48000;
    const channels = options['channels'] || 2;
    const maxFramesPerChunk = options['readSize'] || 1024;

    if(channels != 1 && channels != 2 && channels != 4) {
        throw new Error('Invalid number of channels');
    }

    const bytesPerFrame = 2 * channels;

    if(duplex) {
        return createDuplexStream(samplerate, channels, maxFramesPerChunk, bytesPerFrame);
    } else {
        return createReadableStream(buffer, samplerate, channels, maxFramesPerChunk, bytesPerFrame);
    }
};

function createDuplexStream(samplerate, channels, maxFramesPerChunk, bytesPerFrame) {
    // TODO: change duplex to something better
    const duplex = stream.Duplex();

    var mod_ptr = null;
    var buf_ptr = null;
    var data = [];
    var superPipe = duplex.pipe;
    var toPipe = [];
    var destroyed = false;

    // Once it finishes writing, lets decode the music
    duplex.once('finish', function() {
        mod_ptr = openModule(Buffer.concat(data));
        buf_ptr = initBuffer(bytesPerFrame, maxFramesPerChunk);
        data = null;
        duplex.emit('readable');

        try {
            for(var i = 0; i < toPipe.length; i++) {
                superPipe.apply(duplex, toPipe[i]);
            }
            duplex.pipe = superPipe;
            toPipe = null;
            superPipe = null;
        } catch(e) {}
    });

    duplex._write = function(chunk, enc, next) {
        data.push(chunk);
        next();
    };

    duplex._read = function(m) {
        if(mod_ptr != null) {
            const buf = readModule(mod_ptr, buf_ptr, samplerate, channels, maxFramesPerChunk, bytesPerFrame);
            if(buf == null) {
                cleanupModule(mod_ptr, buf_ptr);
                mod_ptr = null;
                buf_ptr = null;
                destroyed = true;
            }
            duplex.push(buf);
        } else if(destroyed) {
            duplex.push(null);
            duplex.emit('end');
        } else {
            duplex.push(null);
        }
    };

    // Dirty trick. TODO: Change it to something better
    duplex.pipe = function(dest, options) {
        if(mod_ptr != null) {
            superPipe.apply(duplex, arguments);
        } else {
            toPipe.push(arguments);
        }
    };

    duplex.destroy = function() {
        duplex.end();
        destroyed = true;
        cleanupModule(mod_ptr, buf_ptr);
        mod_ptr = null;
        buf_ptr = null;
    };

    createProperties(duplex, mod_ptr);

    return duplex;
}

function createReadableStream(buffer, samplerate, channels, maxFramesPerChunk, bytesPerFrame) {
    const readable = stream.Readable();

    const mod_ptr = openModule(buffer);
    const buf_ptr = initBuffer(maxFramesPerChunk, bytesPerFrame);
    var destroyed = false;

    readable._read = function() {
        if(destroyed) {
            readable.push(null);
            return;
        }
        const buf = readModule(mod_ptr, buf_ptr, samplerate, channels, maxFramesPerChunk, bytesPerFrame);
        if(buf == null) {
            cleanupModule(mod_ptr, buf_ptr);
            destroyed = true;
        }
        readable.push(buf);
    };

    readable.destroy = function() {
        destroyed = true;
        cleanupModule(mod_ptr, buf_ptr);
    };

    createProperties(readable, mod_ptr);

    return readable;
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

function createProperties(obj, mod_ptr) {

    Object.defineProperties(obj, {

        'repeat': {
            get: function() {
                return native._openmpt_module_get_repeat_count(mod_ptr);
            },
            set: function(count) {
                native._openmpt_module_set_repeat_count(mod_ptr, count);
            }
        },
        'position': {
            get: function() {
                return native._openmpt_module_get_position_seconds(mod_ptr);
            },
            set: function(seconds) {
                native._openmpt_module_set_position_seconds(mod_ptr, seconds);
            }
        },
        'duration': {
            get: function() {
                return native._openmpt_module_get_duration_seconds(mod_ptr);
            }
        },
        'current_speed': {
            get: function() {
                return native._openmpt_module_get_current_speed(mod_ptr);
            }
        },
        'current_tempo': {
            get: function() {
                return native._openmpt_module_get_current_tempo(mod_ptr);
            }
        },
        'num_channels': {
            get: function() {
                return native._openmpt_module_get_num_channels(mod_ptr);
            }
        },
        'num_instruments': {
            get: function() {
                return native._openmpt_module_get_num_instruments(mod_ptr);
            }
        },
        'metadata': {
            get: function() {
                const metadata = {};
                const keys = native.Pointer_stringify(native._openmpt_module_get_metadata_keys(mod_ptr)).split(';');
                for(var i = 0; i < keys.length; i++) {
                    var buf = native._malloc(keys[i].length + 1);
                    native.writeStringToMemory(keys[i], buf);
                    metadata[keys[i]] = native.Pointer_stringify(native._openmpt_module_get_metadata(mod_ptr, buf));
                    native._free(buf);
                }
                return metadata;
            }
        }

    });

}
