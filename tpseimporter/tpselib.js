// Alternate entry point when used as an npm dependency

import './polyfills.js';
const { default: importer } = require('../source/importers/import.js');
export default importer;
