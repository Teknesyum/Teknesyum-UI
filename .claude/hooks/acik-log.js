'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', '..', 'logs', 'openlogs');
let adlar = [];
try {
  adlar = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
} catch {}
if (adlar.length)
  process.stdout.write(
    'Açık log ' + adlar.length + ': ' + adlar.join(', ') + '. İstenen işten önce: logs/openlogs/<ad>.md oku, düzelt, `log.js archive --id <ad>` ile kapat; kapatamadığını tek satır gerekçeyle bırak. Sonra istenen işe geç.\n'
  );
