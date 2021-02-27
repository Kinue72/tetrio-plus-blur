import * as tetriosvg from './tetrio-svg.js';
import * as tetrioraster from './tetrio-raster.js';
import * as tetrioanim from './tetrio-animated.js';
import * as jstrisraster from './jstris-raster.js';
import * as jstrisanim from './jstris-animated.js';

const loaders = {
  tetriosvg,
  tetrioraster,
  tetrioanim,
  jstrisraster,
  jstrisanim
};

export function guessFormat(files) {
  for (let [format, { test }] of Object.entries(loaders))
    if (test(files)) return format;
  return null;
}

export async function automatic(files, storage, options) {
  console.error("Guessing skin format", guessFormat(files))
  let loader = loaders[guessFormat(files)];
  if (!loader) throw new Error('Unable to determine format.');
  return await loader.load(files, storage, options);
}
