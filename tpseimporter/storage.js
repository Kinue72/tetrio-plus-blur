export const tpse = {};
export const storage = {};
storage.get = () => { throw new Error('Not implemented') };
storage.delete = () => { throw new Error('Not implemented') };
storage.clear = () => { throw new Error('Not implemented') };
storage.set = vals => Object.assign(tpse, vals);
