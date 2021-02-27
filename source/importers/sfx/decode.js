const sampleRate = 44100;
const channels = 2;

const decoderCtx = new window.OfflineAudioContext(channels, sampleRate, sampleRate);

export async function decodeAudio(buffer) {
  return await decoderCtx.decodeAudioData(buffer);
}

export async function fetchAtlas() {
  // CORS issue when fetching from second URL
  let srcUrl = (typeof window !== 'undefined' && window.browser && window.browser.electron)
    ? 'tetrio-plus://tetrio-plus/js/tetrio.js'
    : 'https://tetr.io/js/tetrio.js';
  let srcRequest = await window.fetch(srcUrl);
  let src = await srcRequest.text();

  let regex = /TETRIO_SE_SHEET\s*=\s*(?:({[^}]+})|.+?JSON\.parse\("\[([\d,]+))/;
  let match = regex.exec(src);
  if (!match) throw new Error('Failed to find sfx atlas');

  let json;
  if (match[1]) {
    json = match[1]
      // Replace quotes
      .replace(/'/g, `"`)
      // Quote unquoted keys
      .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');
  } else if (match[2]) {
    // Existing sfx atlas decoding had a different format since tetrioplus
    // injected an updated atlas definition
    throw new Error('This feature has been removed and should be inaccessible');
  }

  return JSON.parse(json);
}

export async function fetchAudio() {
  let oggUrl = (typeof window !== 'undefined' && window.browser && window.browser.electron)
    ? 'tetrio-plus://tetrio-plus/sfx/tetrio.ogg'
    : 'https://tetr.io/sfx/tetrio.ogg';
  let request = await window.fetch(oggUrl);
  let encodedSfxBuffer = await request.arrayBuffer();
  return await decodeAudio(encodedSfxBuffer);
}

export async function decodeDefaults(status=(()=>{})) {
  let sprites = [];

  status('Fetching sound atlas (js/tetrio.js)');
  let atlas = await fetchAtlas();
  status('Fetching audio file (sfx/tetrio.ogg)');
  let sfxBuffer = await fetchAudio();
  status('Assembling audio sprites...');
  for (let key of Object.keys(atlas)) {
    let [offset, duration] = atlas[key];
    // Convert milliseconds to seconds
    offset /= 1000; duration /= 1000;

    const ctx = new window.OfflineAudioContext(
      channels,
      sampleRate*duration,
      sampleRate
    );

    let source = ctx.createBufferSource();
    source.buffer = sfxBuffer;
    source.connect(ctx.destination);
    source.start(0, offset, duration);
    let audioBuffer = await ctx.startRendering();

    sprites.push({
      name: key,
      buffer: audioBuffer,
      offset,
      duration,
      modified: false
    });
  }

  return sprites;
}
