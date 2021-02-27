import * as tetriosvg from './skin/tetrio-svg.js';
import * as tetrioraster from './skin/tetrio-raster.js';
import * as tetrioanim from './skin/tetrio-animated.js';
import * as jstrisraster from './skin/jstris-raster.js';
import * as jstrisanim from './skin/jstris-animated.js';
import { automatic, guessFormat } from './skin/automatic.js';

import { decodeDefaults, decodeAudio } from './sfx/decode.js';
import encode from './sfx/encode.js';
import * as encodeFromFiles from './sfx/encodeFromFiles.js';

import automaticAny from './automatic.js';

// Types:
// File format: { name: string, type: string, data: arraybuffer }
// Skin options: { delay: number, combine: boolean }
// Sprite: { name: string, buffer: AudioBuffer, offset: number, duration: number, modified: boolean }

const importers = {
  skin: {
    loaders: [tetriosvg, tetrioraster, tetrioanim, jstrisraster, jstrisanim],
    knownAspectRatios: [['Tetrio', 12.4], ['Jstris', 9]],
    guessFormat: guessFormat, // file[] -> string|null
    automatic: automatic, // file[], storage, options
    tetriosvg: tetriosvg.load, // file[1], storage
    tetrioraster: tetrioraster.load, // file[1], storage
    tetrioanim: tetrioanim.load, // file[], storage, options
    jstrisraster: jstrisraster.load, // file[1], storage
    jstrisanim: jstrisanim.load // file[1], storage, options
  },
  sfx: {
    decodeAudio, // ArrayBuffer -> AudioBuffer
    decodeDefaults, // -> Sprite[]
    encode, // { [string]: Sprite }, storage
    encodeFromFiles: encodeFromFiles.load // file[], storage
  },
  music: null,
  bg: {
    regular: null,
    animated: null
  }
};
// Imports anything, guessing at what it is.
importers.automatic = (...args) => automaticAny(importers, ...args);

export default importers;
