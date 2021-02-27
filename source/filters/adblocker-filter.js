[
  "*://adinplay.com/*",
  "*://*.adinplay.com/*"
].forEach(glob => {
  createRewriteFilter("Adblocker", glob, {
    enabledFor: async (storage, url) => {
      let res = await storage.get([ 'blockAds' ]);
      return res.blockAds;
    },
    blockRequest: true
  });
});
