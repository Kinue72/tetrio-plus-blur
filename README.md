# TETR.IO PLUS
Fork from https://gitlab.com/UniQMG/tetrio-plus

TETR.IO block skin, music, sfx customizer and also some other things.

[![forthebadge](https://forthebadge.com/images/badges/contains-technical-debt.svg)](https://forthebadge.com)

## Warnings
* **This software is not associated with or created by Tetr.io or osk**
* **This is provided AS-IS, it's not terribly polished, its not particularly
extensively tested, and it's not packaged into a proper extension.**
* **This can break your game. If your game fails to load or you encounter other
bugs, remove the extension and try again *before* reporting it**
* Chromium-based browsers are not supported as [they lack](https://bugs.chromium.org/p/chromium/issues/detail?id=487422) an [important API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) used by this project.
* This is fork with blur background ![image](https://zoo.hololive.wtf/i/kle9bw26.png)
* I am too lazy to create a gitlab account

## Electron packaging instructions
These are instructions for *packaging electron releases*.
***If you just want to install tetrio-plus, download an `app.asar` from the releases page and replace the existing `app.asar` file in your tetrio install directory***.
These are pre-packaged versions, the following instructions are for developers who modify tetrio-plus themselves.
(`C:\\Users\\%CURRENTUSER%\\AppData\\Local\\Programs\\tetrio-desktop\\resources\app.asar` on windows).

- `cd resources`
- Unpack the asar with `asar extract app.asar out`
- `cd out`
- Install glasstron `npm install glasstron`
- Clone tetrio+ into `out/tetrioplus`
- `npm install node-fetch whatwg-url xmldom` in `out/tetrioplus`
  (Currently doing this manually because the standalone TPSE importer has its own dependencies list
  that would be super bloated for the desktop release, and npm has literally no way to have a third
  list of dependencies.)
- Modify main.js like so:
```javascript
// At the top of the file
const glasstron = require('glasstron');
const {
  onMainWindow,
  modifyWindowSettings,
  handleWindowOpen
} = require('./tetrioplus/source/electron/electron-main');

// Wrap options passed to new BrowserWindow with modifyWindowSettings()
const win = new glasstron.BrowserWindow(modifyWindowSettings({
  ...
}));

// in app.on('open-url'), add the hook
if (mainWindow && !handleWindowOpen(url)) { ... }

// in app.on('second-instance'), add the hook
if (arg.startsWith('tetrio://') && !handleWindowOpen(arg)) { ... }

// At the end of createWindow()
onMainWindow(mainWindow);
```
- Modify preload.js like so:
```javascript
// At the end of the file
require('./tetrioplus/source/electron/preload');
```
- Copy the original vanilla app.asar file to `out/app.asar.vanilla`
- Copy its SHA1 hash into desktop-manifest.js
- Repack the asar file: `asar pack out app.asar`
- Distribute the asar file!

## Firefox packaging instructions
The files can be zipped and distributed as-in, but you can run `pack.sh` to
generate a zipfile without unnecessary (i.e. electron-related) files.

## The standalone TPSE generator
This is a utility to generate TPSE files from local assets without having to manually go through the UIs.
It can either be used as a console app (`node makeTPSE.js -- help`) or as an npm dependency.
See `source/importers/import.js` for an API overview and `importer/app.js` for example usage.

## Directory structure
Tetrio plus is designed to be loaded in two contexts: As a firefox extension, and as a native modification for the desktop client.

### source/bootstrap/browser
Contains general purpose *extension background* scripts for bootstrapping other scripts that are executed in the extension sandbox.

### source/bootstrap/electron
Contains general purpose scripts for bootstrapping other scripts that are executed in a custom (non-secure) sandbox.

### source/shared
Contains scripts that are both loaded in the background process and in content scripts. Mostly
just utilities.

### source/electron
Contains scripts that are used in various contexts in the electron client.

**electron-main.js**: Exports a callback that should be called with the main window as an argument from the main electron process.
**electron-browser-polyfill.js**: Used to polyfill the firefox extension API. Used when loading filters, in the preload script, and in various extension pages.
**preload.js**: Used as an electron preload script in the tetrio window. Mainly responsible for loading content scripts.

### source/filters
Contains filters that modify incoming requests. Bootstrapped by background or electron scripts.

### source/content
Contains content scripts and stylesheets that are sandboxed with access to the tetrio DOM

### source/injected
Contains scripts that are loaded directly into the page via <script>

### source/lib
Contains various libraries for panels and popups

### source/panels
Code for various windows

### source/popup
Code for the main extension popup

### source/shared
Contains some library-like files which are used by both content scripts and directly from electron
