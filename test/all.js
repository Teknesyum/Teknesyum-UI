#!/usr/bin/env node

'use strict';

const path = require('path');
const os = require('os');
const L = require('./lib');

process.env.TEKNESYUM_PRIVATE = path.join(os.tmpdir(), 'tkui-test-raf-yok');

const SUITES = [
  ['cost', require('./cost')],
  ['scanner', require('./scanner')],
  ['install', require('./install')],
  ['generate', require('./generate')],
  ['scaffold', require('./scaffold')],
  ['raf', require('./raf')],
  ['okunurluk', require('./okunurluk')],
  ['onizleme', require('./onizleme')],
  ['kaydet', require('./kaydet')],
  ['ozel', require('./ozel')],
  ['skor', require('./skor')],
  ['tema', require('./tema')],
  ['hooks', require('./hooks')],
  ['rafkitap', require('./rafkitap')],
];

function main() {
  try {
    for (const [name, suite] of SUITES) {
      process.stdout.write(name + '\n');
      suite();
    }
  } finally {
    L.cleanup();
  }

  process.stdout.write('\n' + L.state.pass + ' passed, ' + L.state.fail + ' failed\n');
  if (L.state.failures.length)
    process.stdout.write(L.state.failures.map((f) => '  FAIL  ' + f).join('\n') + '\n');
  process.exitCode = L.state.fail ? 1 : 0;
}

main();
