import { OfflineAudioContext } from 'web-audio-engine';
import fetch, { Response } from 'node-fetch';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import { Canvas, Image } from 'canvas';
import { Blob, FileReader } from 'vblob';

global.self = global;
global.OggVorbisEncoderConfig = { TOTAL_MEMORY: 64 * 1024**2 };
require('../source/lib/OggVorbisEncoder.js');

require('vorbis.js');
import decode from 'audio-decode';

require('./decoders.js');

// Web API polyfills
Object.assign(global, {
  Blob,
  window: {
    Blob,
    FileReader,
    OggVorbisEncoder,
    OfflineAudioContext,
    // OfflineAudioContext: function(...args) {
    //   let ctx = new OfflineAudioContext(...args);
    //   ctx.decodeAudioData = buf => decode(buf);
    //   return ctx;
    // },
    Image,
    document: {
      createElement(el) {
        if (el != 'canvas') throw new Error('Not supported');
        return new Canvas();
      }
    },
    async fetch(url) {
      if (url instanceof Readable)
        return new Response(url);

      let dataUrl = /^data:.+\/(.+);base64,(.*)$/;
      if (dataUrl.test(url)) {
        let [_1,_2,data] = /^data:.+\/(.+);base64,(.*)$/.exec(url);
        let buffer = Buffer.from(data, 'base64');
        return { // mock response
          async text() { return buffer.toString(); },
          async arrayBuffer() { return buffer; }
        }
      }

      return await fetch(url);
    }
  },
  browser: {
    extension: {
      getURL(relpath) {
        return fs.createReadStream(path.join(__dirname, '..', relpath));
      }
    }
  }
});
window.GIFGroover = require('./lib/GIFGroover.js').default;
