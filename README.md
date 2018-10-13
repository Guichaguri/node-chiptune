# node-chiptune
[![NPM](https://nodei.co/npm/node-chiptune.png)](https://nodei.co/npm/node-chiptune/)

Convert tracker music to PCM streams in Node.js.
[Emscripten](https://github.com/kripken/emscripten) was used to translate [libopenmpt](http://lib.openmpt.org/libopenmpt) to Javascript.

If you are looking for a HTML5 player to play tracker music, check out [Chiptune2.js](https://github.com/deskjet/chiptune2.js)

As for libopenmpt 0.3, there are now asm.js binaries being distributed in [their website](https://lib.openmpt.org/libopenmpt/download/). You can update this package by replacing the `libopenmpt.js` and the `libopenmpt.js.mem` files.

## Example

```javascript
var chiptune = require('node-chiptune');
var speaker = require('speaker');

fs.readFile('file.mod', function(err, data) {
    if(err != null) {
        console.log(err);
    } else {
        // Create a chiptune readable stream
        var chiptuneStream = chiptune(data, {
            channels: 2, // 2 channels (stereo)
            sampleRate: 48000 // 48,000 Hz sample rate
        });
        
        // We should be able to pipe the chiptune stream to the speaker
        chiptuneStream.pipe(new Speaker());
    }
});
```

## Supported formats
Basically all the formats supported by libopenmpt, here is the list:

`mod s3m xm it mptm stm pt36 nst m15 stk st26 ice wow ult 669 mtm med far mdl ams dsm amf okt dmf ptm psm mt2 dbm digi imf j2b plm sfx sfx2 mms stp dtm gdm umx mo3 xpk ppm mmcmp`

## Thanks to

* [Deskjet](https://github.com/deskjet) for helping me understand how libopenmpt works
* [OpenMPT](http://openmpt.org/) for their library that made this project possible