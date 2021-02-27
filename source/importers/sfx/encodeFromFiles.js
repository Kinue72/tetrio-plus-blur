import { fetchAtlas, decodeDefaults, decodeAudio } from './decode.js';
import encode from './encode.js';

export async function test(files) {
  if (!files.every(file => /^audio/.test(file.type))) return false;
  let atlas = await fetchAtlas();
  return files.every(file => {
    let noExt = file.name.split('.').slice(0, -1).join('.');
    return !!atlas[noExt];
  });
}

export async function load(files, storage) {
  let sprites = await decodeDefaults(status => console.error(status));

  for (let file of files) {
    let noExt = file.name.split('.').slice(0, -1).join('.');
    let sprite = sprites.filter(sprite => sprite.name == noExt)[0];
    if (!sprite) throw new Error('Unknown sfx name: ' + noExt);
    sprite.buffer = await decodeAudio(file.buffer);
    sprite.duration = sprite.buffer.duration;
    sprite.offset = -1;
    sprite.modified = true;
  }

  await encode(sprites, storage);
}
