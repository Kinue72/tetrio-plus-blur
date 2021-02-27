/*
*/
createRewriteFilter("Music graph hooks", "https://tetr.io/js/tetrio.js", {
  enabledFor: async (storage, url) => {
    let res = await storage.get([
      'musicEnabled', 'musicGraphEnabled'
    ]);
    return res.musicEnabled && res.musicGraphEnabled;
  },
  onStop: async (storage, url, src, callback) => {
    try {
      /**
       * This regex locates the variable holding the 'full'/'tiny' value and
       * one holding something related to board location for use by the next rgx
       */
      var rgx = /playIngame\(\w+,\s*([.\w]+),\s*([.\w]+)/;
      var match = rgx.exec(src);
      if (!match) {
        console.error('Music graph hooks broken (setup/?)');
      } else {
        const typeVar = match[1];
        const spatialVar = match[2];

        /**
         * These two regexii targets two functions that handles text creation and
         * turns them into a global hook for other scripts to consume.
         */
        var match = false;
        var rgx = /Shout:\s*function\((\w{1,2}),(\w{1,2}),(\w{1,2}),(\w{1,2})\)\s*{/i;
        src = src.replace(rgx, ($, arg1, arg2) => {
          match = true;
          return (
            $ +
            `document.dispatchEvent(new CustomEvent('tetrio-plus-actiontext', {
              detail: {
                type: ${arg1},
                text: ${arg2},
                spatialization:${spatialVar}
              }
            }));`
          )
        });
        if (!match) {
          console.error('Music graph hooks broken (text 1/2)');
        }

        var match = false;
        var rgx = /Splash:\s*function\((\w{1,2}),(\w{1,2})\)\s*{/;
        src = src.replace(rgx, ($, arg1, arg2) => {
          match = true;
          return (
            $ +
            `document.dispatchEvent(new CustomEvent('tetrio-plus-actiontext', {
              detail: {
                type: ${arg1},
                text: ${arg2},
                spatialization:${spatialVar}
              }
            }));`
          )
        });
        if (!match) {
          console.error('Music graph hooks broken (text 2/2)');
        }

        /**
         * This regex targets a function that plays sound effects and turns it
         * into a global hook for other scripts to consume.
         */
        var match = false;
        var rgx = /playIngame:\s*function\((\w+),[^)]+\)\s*{/i;
        src = src.replace(rgx, ($, arg1) => {
          match = true;
          return (
            $ +
            `document.dispatchEvent(new CustomEvent('tetrio-plus-actionsound', {
              detail: {
                name: ${arg1},
                args: [...arguments]
              }
            }));`
          )
        });
        if (!match) {
          console.error('Music graph hooks broken (sfx)');
        }

        /**
         * This regex targets a bit of the code that calculates the board +
         * garbage height near the code that emits the 'warning' sound effect,
         * and uses it to emit an event for the current board height plus
         * incoming garbage height.
         */
        var match = false;
        var rgx = /((\w{1,2})\s*=\s*)(Math\.max\(0,\s*\2\s*-\s*Math\.min.+)(\)\s*>\s*19)/i;
        src = src.replace(rgx, ($, prematch, varName, expression, postmatch) => {
          match = true;
          return (
            /* o = */`${prematch}(() => {
              let height = ${expression};
              document.dispatchEvent(new CustomEvent('tetrio-plus-actionheight', {
                detail: {
                  height,
                  type:${typeVar},
                  spatialization:${spatialVar}
                }
              }));
              return height;
            })()${postmatch}` /* > 19 */
          );
        });
        if (!match) {
          console.error('Music graph hooks broken (height)');
        }
      }
    } finally {
      callback({
        type: 'text/javascript',
        data: src,
        encoding: 'text'
      });
    }
  }
})
