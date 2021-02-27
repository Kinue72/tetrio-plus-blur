import { spawn } from 'child_process';
import { decoder } from 'web-audio-engine';
import { ReadableStreamBuffer } from 'stream-buffers';
import decode from 'audio-decode';

decoder.set('oga', async (arraybuf, opts) => {
  try {
    console.error('Decoding audio of length', arraybuf.byteLength);
    let result = await decode(Buffer.from(arraybuf));
    return { ...result, channelData: result._channelData };
  } catch(ex) { console.error(ex); }
});
