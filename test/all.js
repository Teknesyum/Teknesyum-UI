#!/usr/bin/env node

'use strict';

const L = require('./lib');

const SUITES = [
  ['cost', require('./cost')],
  ['scanner', require('./scanner')],
  ['install', require('./install')],
  ['generate', require('./generate')],
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
