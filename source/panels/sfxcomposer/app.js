import importer from '../../importers/import.js';
const html = arg => arg.join(''); // NOOP, for editor integration.


const app = new Vue({
  template: html`
    <!-- Error screen -->
    <div v-if="error">
      <h1>Error</h1>
      <pre>{{ error }}</pre>
      Try updating your plugin
    </div>

    <!-- Preload -->
    <div v-else-if="loading">
      <em>Please wait...</em>
    </div>

    <!-- Editor -->
    <div v-else>
      <fieldset>
        <legend>sfx/tetrio.ogg</legend>
        <audio src="http://tetr.io/sfx/tetrio.ogg" controls></audio>
      </fieldset>
      <div v-if="decoding">
        Decoding: {{ decodeStatus }}...<br>
      </div>
      <div v-else-if="encoding">
        Encoding new sfx file...
      </div>
      <div v-else>
        <fieldset>
          <legend>Save changes</legend>
          <button @click="save">Re-encode and save changes</button><br>
          This may freeze your browser for a bit.
          <div v-if="encodeResult">
            Encode completed. Result:<br>
            <audio :src="encodeResult" controls></audio>
          </div>
        </fieldset>
        <fieldset>
          <legend>Replace multiple by filename</legend>
          <em>sfx name must match file name without extension.</em><br>
          <input type="file" @change="replaceMultiple($event)" accept="audio/*" multiple/>
        </fieldset>
      </div>

      <fieldset v-for="sprite of sprites">
        <legend>{{ sprite.name }}</legend>
        <div v-if="sprite.error" :title="sprite.error">
          Encountered an error while encoding this sprite.
          This sprite must be replaced or else it will be empty.<br>
          <button @click="sprite.showError = !sprite.showError">
            Show/hide
          </button>
          <pre v-if="sprite.showError">{{ sprite.error }}</pre>
        </div>
        <button @click="play(sprite)">Play</button>
        <span v-if="sprite.modified">
          ( Modified,
            Duration: <code>{{ sprite.duration.toFixed(3) }}s</code>
          )
        </span>
        <span v-else>
          (
            Duration: <code>{{ sprite.duration.toFixed(3) }}s</code>.
            Offset: <code>{{ sprite.offset.toFixed(3) }}s</code>
          )
        </span>

        <br>

        Replace:
        <input type="file" @change="replace($event, sprite)" accept="audio/*"/>
      </fieldset>
    </div>
  `,
  data: {
    error: null,

    loading: true,

    decoding: false,
    decodeStatus: "",

    encoding: false,
    encodeResult: null,

    audioContext: null,

    sprites: [],
  },
  async mounted() {
    this.loading = false;
    this.audioContext = new AudioContext();
    this.decode();
  },
  methods: {
    play(sprite) {
      let source = this.audioContext.createBufferSource();
      source.connect(this.audioContext.destination);
      source.buffer = sprite.buffer;
      source.start();
    },

    async save() {
      this.encodeResult = null;
      this.encoding = true;
      await new Promise(res => this.$nextTick(res));
      this.encodeResult = await importer.sfx.encode(
        this.sprites,
        browser.storage.local
      );
      this.encoding = false;
    },

    async replace(evt, sprite) {
      let file = evt.target.files[0];
      if (!file) return;

      let reader = new FileReader();
      await new Promise(res => {
        reader.addEventListener('load', res);
        reader.readAsArrayBuffer(file);
      });

      sprite.buffer = await importer.sfx.decodeAudio(reader.result);
      sprite.duration = sprite.buffer.duration;
      sprite.offset = -1;
      sprite.modified = true;

      console.log("Sprite buffer replaced", sprite.buffer);

      // reset the handler
      evt.target.type = '';
      evt.target.type = 'file';
    },

    async replaceMultiple(evt) {
      let replaced = [];
      for (let file of evt.target.files) {
        let noExt = file.name.split('.').slice(0, -1).join('.');
        let sprite = this.sprites.filter(sprite => {
          return sprite.name == noExt;
        })[0];

        if (!sprite) {
          replaced.push(`FAILED: Unknown sound effect ${noExt}`)
          continue;
        }

        let reader = new FileReader();
        await new Promise(res => {
          reader.addEventListener('load', res);
          reader.readAsArrayBuffer(file);
        });

        let sfxBuffer = await importer.sfx.decodeAudio(reader.result);
        sprite.buffer = sfxBuffer;
        sprite.duration = sprite.buffer.duration;
        sprite.offset = -1;
        sprite.modified = true;

        replaced.push(`Success: ${noExt}`)
      }
      alert(replaced.join('\n'));
      // reset the handler
      evt.target.type = '';
      evt.target.type = 'file';
    },

    async decode() {
      try {
        this.decodeStatus = "Starting";
        this.decoding = true;

        // Set sfx enabled flag temporarily, to fetch the appropriate content.
        let { sfxEnabled } = await browser.storage.local.get('sfxEnabled');
        await browser.storage.local.set({ sfxEnabled: false });

        this.sprites.push(...await importer.sfx.decodeDefaults(msg => {
          this.decodeStatus = msg;
        }));

        // Reset the sfx enabled flag since we're now done fetching data
        await browser.storage.local.set({ sfxEnabled });

        this.decodeStatus = null;
        this.decoding = false;
      } catch(ex) {
        this.error = ex;
        console.error(ex);
      }
    }
  }
});

window.app = app;
app.$mount('#app');
