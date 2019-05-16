function extractMetablock(userscriptText) {
  try {
    const blocksReg = /\B(\/\/ ==UserScript==\n([\S\s]*?)\n\/\/ ==\/UserScript==)([\S\s]*)/;
    const blocks = userscriptText.match(blocksReg);

    if (!blocks) {
      return null;
    }

    const metablock = blocks[1];
    const metas = blocks[2];
    const code = blocks[3];

    const meta = {};
    const metaArray = metas.split('\n');
    for (let i = 0; i < metaArray.length; i++) {
      const parts = metaArray[i].match(/@([\w-]+)\s+(.+)/);
      if (parts) {
        meta[parts[1]] = meta[parts[1]] || [];
        meta[parts[1]].push(parts[2]);
      }
    }
    return {
      meta: meta,
      metablock: metablock,
      content: code,
    };
  } catch (e) {
    if (console) console.error(e);
    return null;
  }
}
