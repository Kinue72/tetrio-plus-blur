try {
  let globalVolume = 0;
  let lastUpdate = 0;
  function getGlobalVolume() {
    if (Date.now() - lastUpdate > 1000) {
      globalVolume = JSON.parse(localStorage.userConfig).volume.music;
      lastUpdate = Date.now();
    }
    return globalVolume;
  }

  // Doesn't fire :(
  // window.addEventListener('storage', () => console.log("STORAGE"));

  (async function() {
    if (window.location.pathname != '/') return;

    let storage = await getDataSourceForDomain(window.location);
    let {
      music, musicGraph, musicEnabled, musicGraphEnabled
    } = await storage.get([
      'music', 'musicGraph', 'musicEnabled', 'musicGraphEnabled'
    ]);
    if (!musicEnabled || !musicGraphEnabled || !musicGraph)
      return;

    const musicRoot = '/res/bgm/akai-tsuchi-wo-funde.mp3?song=';
    const context = new AudioContext();
    const audioBuffers = {};

    const graph = {};
    for (let src of JSON.parse(musicGraph)) {
      graph[src.id] = src;
      if (!src.audio) continue;
      if (audioBuffers[src.audio]) continue;

      let key = 'song-' + src.audio;
      let base64 = (await storage.get(key))[key];
      let rawBuffer = await fetch(base64).then(res => res.arrayBuffer());
      // let rawBuffer = convertDataURIToArrayBuffer(base64);
      let decoded = await context.decodeAudioData(rawBuffer);
      audioBuffers[src.audio] = decoded;
    }

    // A list of events that use == != > < valueOperators
    const eventValueExtendedModes = [
      'text-spike',
      'text-combo',
      'board-height-player',
      'board-height-enemy'
    ];
    // A list of events that use the value field
    const eventValueEnabled = [
      'time-passed',
      'text-b2b-combo',
      ...eventValueExtendedModes
    ];

    const nodes = [];
    class Node {
      constructor() {
        // console.log("Created new node");
        this.audio = null; // AudioBufferSourceNode
        this.volume = null; // GainNode
        this.timeouts = [];
        this.startedAt = null;
        this.children = [];
      }

      setSource(source, startTime=0, crossfade=false) {
        if (this.destroyed) return;
        // console.log(`Node ${this?.source?.name} -> ${source.name}`)
        this.source = source;

        for (let timeout of this.timeouts)
          clearTimeout(timeout);
        this.timeouts.length = 0;

        this.restartAudio(startTime, crossfade);

        for (let trigger of this.source.triggers) {
          switch (trigger.event) {
            case 'time-passed':
              let timeout = setTimeout(() => {
                this.runTrigger(trigger);
              }, trigger.value*1000);
              this.timeouts.push(timeout);
              break;
          }
        }
      }

      restartAudio(startTime, crossfade=false) {
        if (this.destroyed) return;
        if (!this.source.audio) {
          this.runTriggersByName('node-end');
          return;
        }

        let audioSource = context.createBufferSource();
        audioSource.buffer = audioBuffers[this.source.audio];
        audioSource.onended = () => {
          if (this.audio != audioSource) return;
            this.runTriggersByName('node-end');
        };

        audioSource.playbackRate.value = this.source.effects.speed;

        let gainNode = context.createGain();
        gainNode.gain.value = this.source.effects.volume * getGlobalVolume();

        if (this.audio) {
          if (!crossfade) {
            this.audio.stop();
          } else {
            let oldAudio = this.audio;
            let oldVolume = this.volume;
            gainNode.gain.value = 0;

            let start = Date.now();
            let end = start + crossfade * 1000;
            let startVolOld = oldVolume.gain.value;

            let interval = setInterval(() => {
              let progress = 1 - (end - Date.now()) / (end - start);
              if (progress > 1) {
                clearInterval(interval);
                oldAudio.stop();
                return;
              }

              oldVolume.gain.value = (1 - progress) * startVolOld;
              this.volume.gain.value = (
                progress *
                this.source.effects.volume *
                getGlobalVolume()
              );
            }, 16);
          }
        }

        audioSource.connect(gainNode).connect(context.destination);
        audioSource.start(0, startTime);
        this.startedAt = context.currentTime - startTime;

        this.audio = audioSource;
        this.volume = gainNode;
      }

      get currentTime() {
        return context.currentTime - this.startedAt;
      }

      destroy() {
        this.destroyed = true;
        if (this.audio)
          this.audio.stop();
        let index = nodes.indexOf(this);
        if (index !== -1)
          nodes.splice(index, 1);
        for (let child of this.children)
          child.runTriggersByName('parent-node-destroyed');
        this.children.length = 0;
      }

      runTriggersByName(name) {
        for (let trigger of this.source.triggers)
          if (trigger.event == name)
            this.runTrigger(trigger);
      }

      runTrigger(trigger) {
        // console.log(
        //   `Node ${this.source.name} running trigger ` +
        //   `${trigger.event} ${trigger.mode} ${trigger.target}`
        // );
        let startTime = trigger.preserveLocation
          ? this.currentTime * trigger.locationMultiplier
          : 0;
        switch (trigger.mode) {
          case 'fork':
            var src = graph[trigger.target];
            if (!src) {
              console.error("[Tetr.io+] Unknown node #" + trigger.target);
              break;
            }
            var node = new Node();
            node.setSource(src, startTime);
            nodes.push(node);
            this.children.push(node);
            break;

          case 'goto':
            var src = graph[trigger.target];
            if (!src) {
              console.error("[Tetr.io+] Unknown node #" + trigger.target);
              break;
            }
            let crossfade = trigger.crossfade && trigger.crossfadeDuration;
            this.setSource(src, startTime, crossfade);
            break;

          case 'kill':
            this.destroy();
            break;

          case 'random':
            let triggers = this.source.triggers.filter(trigger =>
              trigger.event == 'random-target' && trigger.mode != 'random'
            );
            if (triggers.length == 0) break;
            this.runTrigger(triggers[
              Math.floor(Math.random() * triggers.length)
            ]);
            break;
        }
      }

      toString() {
        let debug = ['Node ', this.source.name];
        for (let trigger of this.source.triggers) {
          debug.push('\n​ ​ ​ ​ ');
          debug.push(trigger.event + ' ');
          if (eventValueExtendedModes.indexOf(trigger.event) > -1)
            debug.push(trigger.valueOperator + ' ');
          if (eventValueEnabled.indexOf(trigger.event) > -1)
            debug.push(trigger.value + ' ');
          debug.push(trigger.mode + ' ');
          if (trigger.mode == 'fork' || trigger.mode == 'goto')
            debug.push('' + (graph[trigger.target] || {}).name);
        }
        return debug.join('');
      }
    }

    Object.values(graph)
      .filter(src => src.type == 'root')
      .map(src => {
        let node = new Node();
        node.setSource(src);
        return node;
      })
      .forEach(node => nodes.push(node));

    let recentEvents = [];

    let f8menu = document.getElementById('devbuildid');
    let f8menuActive = false;
    if (!f8menu) {
      console.log("[Tetr.io+] Can't find '#devbuildid'?")
    } else {
      let div = document.createElement('div');
      f8menu.parentNode.insertBefore(div, f8menu.nextSibling.nextSibling);
      div.style.fontFamily = 'monospace';
      setInterval(() => {
        f8menuActive = !f8menu.parentNode.classList.contains('off');
        if (!f8menuActive) return;

        div.innerText = [
          'Tetr.io+ music graph debug',
          'Recent events: ' + [...recentEvents].reverse().join(', '),
          ...nodes.map(node => node.toString())
        ].join('\n');
      }, 100);
    }

    function dispatchEvent(eventName, value) {
      if (f8menuActive) {
        let str = typeof value == 'number'
          ? `${eventName} (${value})`
          : eventName;

        let index = recentEvents.indexOf(str);
        if (index !== -1)
          recentEvents.splice(index, 1);

        recentEvents.push(str);

        if (recentEvents.length > 20)
          recentEvents = recentEvents.slice(-20);
      }

      for (let node of [...nodes]) {
        iterTriggers: for (let trigger of node.source.triggers) {
          if (trigger.event != eventName)
            continue;

          if (typeof value == 'number') {
            if (eventValueExtendedModes.indexOf(trigger.event) >= 0) {
              valueSwitcher: switch (trigger.valueOperator || '==') {
                case '==':
                  if (!(value == trigger.value)) continue iterTriggers;
                  break valueSwitcher;
                case '!=':
                  if (!(value != trigger.value)) continue iterTriggers;
                  break valueSwitcher;
                case '>':
                  if (!(value > trigger.value)) continue iterTriggers;
                  break valueSwitcher;
                case '<':
                  if (!(value < trigger.value)) continue iterTriggers;
                  break valueSwitcher;
              }
            } else {
              if (trigger.value != value && trigger.value != 0)
                continue;
            }
          }

          node.runTrigger(trigger);
        }
      }
    }

    function locationHeuristic(size, spatialization) {
      if (size == 'tiny') return 'enemy'; // If tiny, always an enemy
      // Solo spatialization is exactly 0
      // Duel spatialization is -0.3499...
      if (spatialization <= 0) return 'player';
      // Duel enemy spatialization is 0.4499...
      return 'enemy';
    }
    document.addEventListener('tetrio-plus-actiontext', evt => {
      // console.log('IJ actiontext', evt.detail.type, evt.detail.text);
      let type = locationHeuristic(evt.detail.type, evt.detail.spatialization);

      switch (evt.detail.type) {
        case 'countdown':
          dispatchEvent('text-countdown-' + evt.detail.text);
          break;

        case 'countdown_stride':
          let vals = { 'ready': 3, 'set': 2, 'GO!': 1 };
          dispatchEvent('text-countdown-' + vals[evt.detail.text]);
          break;

        case 'allclear':
          dispatchEvent('text-all-clear-' + type);
          break;

        case 'clear':
          dispatchEvent('text-clear-' + evt.detail.text.toLowerCase() + '-' + type);
          break;

        case 'combo':
          dispatchEvent('text-combo-' + type, parseInt(evt.detail.text));
          break;

        case 'tspin':
          if (!/^[OTIJLSZ]-spin$/.test(evt.detail.text)) break;
          let piece = evt.detail.text[0].toLowerCase();
          dispatchEvent('text-' + piece + '-spin-' + type);
          dispatchEvent('text-any-spin-' + type);
          break;

        case 'also':
          if (evt.detail.text == 'back-to-back')
            dispatchEvent('text-b2b-singleplayer');
          break;

        case 'spike':
          dispatchEvent('text-spike-' + type, parseInt(evt.detail.text));
          break;

        case 'also_permanent':
          if (evt.detail.text.startsWith('B2B')) {
            let number = parseInt(/\d+$/.exec(evt.detail.text)[0]);
            dispatchEvent('text-b2b-combo-' + type, number);
            dispatchEvent('text-b2b-' + type);
          }
          break;

        case 'also_failed':
          if (evt.detail.text.startsWith('B2B'))
            dispatchEvent('text-b2b-reset-' + type);
          break;
      }
    });
    document.addEventListener('tetrio-plus-actionsound', evt => {
      // arg 1: sound effect name
      // arg 2: 'full' for active board or general sfx, 'tiny' for other boards
      // arg 3: -0 for full sound effects, -1 to 1 for tiny ones. Possibly spatialization?
      // arg 4: 1 for full sound effects, 0-1 for tiny ones. Possibly volume?
      // arg 5: always false
      // arg 6: true on full, false on tiny
      // arg 7: always 1
      // console.log('IJ actionsound', ...evt.detail.args);
      let name = evt.detail.args[0];
      let type = locationHeuristic(evt.detail.args[1], evt.detail.args[2]);
      dispatchEvent(`sfx-${name}-${type}`);
    });
    document.addEventListener('tetrio-plus-actionheight', evt => {
      // The 'height' is actually the *unfilled* portion of the board,
      // but we want the filled portion to pass for the event
      let height = 40 - evt.detail.height;
      let type = locationHeuristic(evt.detail.type, evt.detail.spatialization);
      dispatchEvent(`board-height-${type}`, height);
    });
  })().catch(console.error);

} catch(ex) { console.error(ex) }
