'use strict';

const raf = require('../raf');

module.exports = {
  id: 'raf',

  projectRules: [
    {
      id: 'ister',
      severity: 'error',
      check(ctx) {
        if (!raf.var()) return [];
        const liste = raf.dosyalar(ctx.root);
        const out = [];
        for (const kitap of raf.uyan(ctx.root, { liste, icerik: !ctx.picked || ctx.picked === ctx.files })) out.push(...raf.denetle(ctx.root, kitap, liste));
        return out;
      },
    },
  ],
};
