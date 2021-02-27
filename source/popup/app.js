import OptionToggle from './components/OptionToggle.js'
import ThemeManager from './components/ThemeManager.js';
import SkinChanger from './components/SkinChanger.js';
import SfxManager from './components/SfxManager.js';
import MusicManager from './components/MusicManager.js';
import BackgroundManager from './components/BackgroundManager.js';
import UrlPackLoader from './components/URLPackLoader.js';
const html = arg => arg.join(''); // NOOP, for editor integration.

const app = new Vue({
  template: html`
    <div id="app">
      <h1>
        TETR.IO PLUS
        <span class="version">
          v{{version}} | <a
            class="wiki"
            href="https://gitlab.com/UniQMG/tetrio-plus/wikis"
            @click="openSource($event)"
          >Wiki</a>
          <span v-if="debugMode">| Developer mode</span>
        </span>
      </h1>
      <p class="tagline">Unofficial TETR.IO Customization Tool</p>

      <template v-if="updateHref">
        <a href="#" @click.prevent="openInBrowser(updateHref)">
          {{ updateStatus }}
        </a>
      </template>
      <template v-else>{{ updateStatus}}</template>

      <fieldset class="section contentPackInfo" v-if="contentPack">
        <legend>Content Pack</legend>
        <div v-if="contentPackIssue" style="max-width: 400px">
          This page is attempting to use a remote content pack, but
          {{ contentPackIssue }}.
        </div>
        <div v-else>
          This page is using a remote content pack.<br>
          <a class="longLink" :href="contentPack">{{ contentPack }}</a><br>
          <button @click="openSettingsIO(contentPack)">Install this pack</button>
          <button @click="clearPack" v-if="isElectron">Stop</button>
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Skins</legend>
        <skin-changer />
      </fieldset>
      <fieldset class="section">
        <legend>Sound effects</legend>
        <sfx-manager />
      </fieldset>
      <fieldset class="section">
        <legend>Music</legend>
        <music-manager />
      </fieldset>
      <fieldset class="section">
        <legend>Backgrounds</legend>
        <background-manager />
      </fieldset>
      <fieldset class="section">
        <legend>Custom features</legend>
        <option-toggle storageKey="enableAllSongTweaker">
          <span :title="(
            'Adds a field to the in-game music tweaker that allows you to ' +
            'set the occurance rate for all songs at once.'
          )">
            Enable 'All Songs' in music tweaker
          </span>
        </option-toggle>
        <div class="option-group">
          <option-toggle storageKey="enableCustomMaps">
            <span :title="(
              'Enables using custom maps for singleplayer. Open the editor ' +
              'and set the map string under solo -> custom -> meta.'
            )">
              Enable custom maps
            </span>
          </option-toggle>
          <div>
            <option-toggle inline storageKey="enableTouchControls">
              <span :title="(
                'Allows you to control the game using touch inputs. Inputs ' +
                'are mapped to two virtual joysticks on each side of the page. ' +
                'Left up = harddrop, left down = softdrop, left left = move left ' +
                'left right = move right. right up = 180 spin, right left = ccw ' +
                'spin, right right = cw spin, right down = hold.'
              )">
                Enable touch controls
              </span>
            </option-toggle>
            <option-toggle inline storageKey="enableTouchControls" mode="show">
              <button @click="openTouchEditor">Edit</button>
            </option-toggle>
            <option-toggle storageKey="enableEmoteTab">
              <span :title="(
                'Shows an emote picker when pressing tab in chat'
              )">
                Enable emote picker
              </span>
            </option-toggle>
          </div>
          <option-toggle storageKey="enableOSD">
            <span :title="(
              'Shows what keys are pressed, for streaming or recording. ' +
              'Works on replays too!'
            )">
              Enable key OSD
            </span>
          </option-toggle>
        </div>
      </fieldset>
      <fieldset class="section">
        <legend>Miscellaneous</legend>
        <div class="option-group">
          <url-pack-loader />
          <option-toggle storageKey="bypassBootstrapper">
            <span :title="(
              'Disables integrity checks on the tetrio.js file and loads ' +
              'it directly. Fixes stacktraces but may make the anticheat ' +
              'angery.'
            )">
              Bypass bootstrapper
            </span>
          </option-toggle>
          <option-toggle storageKey="openDevtoolsOnStart" v-if="isElectron">
            <span :title="(
              'Opens the developer tools as soon as the game launches. ' +
              'Works even if you can\\'t open them via hotkey'
            )">
              Open devtools automatically
            </span>
          </option-toggle>
          <option-toggle storageKey="hideTetrioPlusOnStartup" v-if="isElectron">
            <span :title="(
              'Hides this window on startup. You can press ctrl-t to reopen it.'
            )">
              Hide Tetrio Plus window on startup
            </span>
          </option-toggle>
          <div v-if="isElectron">
            <option-toggle inline storageKey="blockAds">
              <span title="Blocks ad scripts">
                Block Ads
              </span>
            </option-toggle>
            <option-toggle inline storageKey="blockAds" mode="show">
              <a
                href='#'
                @click.prevent="openMonetizationInfo"
                class="warning-icon"
                :title="(
                  'Please consider supporting the game!' +
                  ' Click this link to learn more.'
                )"
              >please read</a>
            </option-toggle>
            <option-toggle storageKey="enableUpdateCheck" @changed="updateCheck()">
              <span title="Notifies you if an update is available">
                Enable update check
              </span>
            </option-toggle>
          </div>
          <div v-if="isElectron">
            <button @click="uninstall">Uninstall TETR.IO PLUS</button>
          </div>

          <option-toggle
            storageKey="debugBreakTheGame"
            mode="trigger"
            v-if="!debugMode"
            @trigger="enableDebugMode()"
          ></option-toggle>
          <option-toggle storageKey="debugBreakTheGame" v-if="debugMode">
            <span title="Has a minor chance of completely breaking the game 100% of the time">
              Break the game (May break the game)
            </span>
          </option-toggle>
          <theme-manager v-if="!isElectron" />
        </div>
        <div class="control-group">
          <button @click="openSettingsIO()" title="Opens the settings manager">
            Manage data / import TPSE
          </button>
        </div>
      </fieldset>
      <fieldset class="section legendless">
        <strong>Hard refresh (<kbd>ctrl-F5</kbd>) Tetrio after making changes.</strong><br>
        <a href="https://gitlab.com/UniQMG/tetrio-plus" @click="openSource($event)">
          Source code and readme
        </a>
      </fieldset>
    </div>
  `,
  components: {
    OptionToggle,
    UrlPackLoader,
    ThemeManager,
    SkinChanger,
    SfxManager,
    MusicManager,
    BackgroundManager
  },
  data: {
    updateStatus: null,
    updateHref: null,
    debugMode: false,
    contentPack: null,
    allowURLPackLoader: null,
    whitelistedLoaderDomains: null
  },
  computed: {
    isElectron() {
      return !!browser.electron;
    },
    version() {
      return browser.runtime.getManifest().version;
    },
    contentPackIssue() {
      if (!this.allowURLPackLoader)
        return 'remote pack loading by URL is not enabled';

      let url = new URL(this.contentPack);
      if (this.whitelistedLoaderDomains.indexOf(url.origin) == -1)
        return 'the domain (' + url.origin + ') isn\'t whitelisted';

      return null;
    }
  },
  mounted() {
    let str = '';
    window.addEventListener('keydown', evt => {
      str = (str + evt.key).slice(-5);
      if (str == 'debug')
        this.enableDebugMode();
    });
    if (browser.tabs.query) {
      browser.tabs.query({
        active: true,
        windowId: browser.windows.WINDOW_ID_CURRENT
      }).then(tabs => {
        let port = browser.runtime.connect({ name: 'info-channel' });
        port.postMessage({ type: 'getUrlFromTab', tabId: tabs[0].id });
        port.onMessage.addListener(msg => {
          this.refreshContentPackInfo();
          if (msg.type != 'getUrlFromTabResult') return;
          let { useContentPack } = new URL(msg.url)
            .search
            .slice(1)
            .split('&')
            .map(e => e.split('='))
            .reduce((obj, [key, value]) => {
              obj[key] = value;
              return obj;
            }, {});
          if (!useContentPack) return;
          this.contentPack = decodeURIComponent(useContentPack);
        });
      })
    } else {
      // Use this syntax to avoid making the mdn verifier angery.
      // This is never called on firefox.
      let foo = browser.tabs;
      foo.electronOnMainNavigate(url => {
        this.refreshContentPackInfo();
        let match = /\?useContentPack=([^&]+)/.exec(url);
        if (!match) {
          this.contentPack = null;
          return;
        }
        this.contentPack = decodeURIComponent(match[1]);
      })
    }
    this.updateCheck();
  },
  methods: {
    openInBrowser(url) {
      window.openInBrowser(url)
    },
    refreshContentPackInfo() {
      browser.storage.local.get([
        'allowURLPackLoader',
        'whitelistedLoaderDomains'
      ]).then(cfg => {
        this.allowURLPackLoader = cfg.allowURLPackLoader;
        this.whitelistedLoaderDomains = cfg.whitelistedLoaderDomains || "";
      });
    },
    clearPack() {
      // Use this syntax to avoid making the mdn verifier angery.
      // This is never called on firefox.
      let foo = browser.tabs;
      foo.electronClearPack();
    },
    enableDebugMode() {
      console.log("Enabled debug mode")
      this.debugMode = true;
    },
    async openSettingsIO(installUrl) {
      let url = 'source/panels/settingsImportExport/index.html';
      if (installUrl) url += '?install=' + encodeURIComponent(installUrl);

      let { name } = await browser.runtime.getBrowserInfo();
      if (name == 'Fennec') {
        browser.tabs.create({
          url: browser.extension.getURL(url),
          active: true
        });
      } else {
        browser.windows.create({
          type: 'detached_panel',
          url: browser.extension.getURL(url),
          width: 600,
          height: 520
        });
      }
    },
    openMonetizationInfo() {
      browser.windows.create({
        type: 'detached_panel',
        url: browser.extension.getURL(
          'source/panels/monetizationinfo/index.html'
        ),
        width: 750,
        height: 350
      });
    },
    openTouchEditor() {
      browser.tabs.create({
        url: browser.extension.getURL(
          'source/panels/touchcontroleditor/index.html'
        ),
        active: true
      });
    },
    openSource(evt) {
      if (this.isElectron) {
        evt.preventDefault();
        openInBrowser(evt.target.href);
      }
    },
    uninstall() {
      browser.management.uninstallSelf().catch(ex => {
        alert(ex.toString());
      });
    },
    async updateCheck() {
      let res = await browser.storage.local.get('enableUpdateCheck');
      if (!res.enableUpdateCheck) {
        this.updateStatus = null;
        this.updateHref = null;
        return;
      }
      this.updateStatus = 'Checking for updates...';
      this.updateHref = null;

      function compare(version, target) {
        version = version.split('.').map(n => +n);
        target = target.split('.').map(n => +n);
        for (let i = 0; i < 3; i++) {
          if (version[i] > target[i]) return 1;
          if (version[i] < target[i]) return -1;
        }
        return 0;
      }

      try {
        const latest = await window.fetchGitlabReleasesJson();
        const regex = /^electron-v(\d+\.\d+\.\d+)-tetrio-v\d+$/;

        const target = regex.exec(latest[0].tag)[1];
        const version = this.version;
        if (compare(version, target) == -1) {
          this.updateStatus = 'Update available: ' + target;
          const baseUrl = 'https://gitlab.com/UniQMG/tetrio-plus/-/releases';
          this.updateHref = `${baseUrl}/${latest[0].tag}`;
        } else {
          this.updateStatus = 'Using latest version';
        }
      } catch(ex) {
        this.updateStatus = 'Failed to check for updates';
        console.error('Failed to check for updates:', ex);
      }
    }
  }
});

app.$mount('#app');
