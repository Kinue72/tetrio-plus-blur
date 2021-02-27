import { test as sfxTest, load as sfxLoad } from './sfx/encodeFromFiles.js';
import { test as musicTest, load as musicLoad } from './music.js';

export default async function automatic(importers, files, storage, options) {
  if (files.every(file => /^image/.test(file.type))) {
    console.error("Guessing import type skin");
    return await importers.skin.automatic(files, storage, options);
  }
  if (await sfxTest(files)) {
    console.error("Guessing import type sfx");
    return await sfxLoad(files, storage);
  }
  if (await musicTest(files)) {
    console.error("Guessing import type music");
    return await musicLoad(files, storage);
  }
  // TODO: backgrounds
  throw new Error("Unable to determine import type");
}
