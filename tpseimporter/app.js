// Console app entry point
import './polyfills.js';
import { program } from 'commander';
import { storage, tpse } from './storage.js';
// (sync) async import so the polyfills take effect first
const { default: importer } = require('../source/importers/import.js');
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { Image } from 'canvas';

function forceInt(value) {
  let int = parseInt(value);
  if (isNaN(int)) throw new Error('Expected numeric delay value');
  return int;
}
const manifest = require('../manifest.json');
program.version(manifest.version);
program.option('-c, --no-combine', 'Don\'t combine animated skin frames');
program.option('-d, --delay <number>', 'Animated skin frame delay', forceInt, 0);

program
  .command('import <files...>')
  .description('Imports files')
  .action(async filenames => {
    let files = filenames.map(filename => {
      let file = {
        name: path.basename(filename),
        type: mime.lookup(filename)
      }
      let buffer = fs.readFileSync(filename);
      file.buffer = buffer;
      file.data = `data:${file.type};base64,${buffer.toString('base64')}`;
      if (file.type.startsWith('image')) {
        file.image = new Image();
        file.image.src = file.data;
        file.image.onerror = ex => { throw ex; }
      }
      return file;
    });

    console.error(`${files.length} input file(s)`);
    for (let file of files)
      console.error(`[${file.type}] ${file.name}`);

    await importer.automatic(files, storage, {
      delay: program.delay,
      combine: program.combine
    }).catch(ex => {
      console.error("Error: " + ex);
      // process.exit(1);
    });

    console.log(JSON.stringify(tpse, null, 2));
    console.error("Done");
  });

program.parse(process.argv);
