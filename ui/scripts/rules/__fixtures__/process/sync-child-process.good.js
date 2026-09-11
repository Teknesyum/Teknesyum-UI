#!/usr/bin/env node
const { execFileSync, spawnSync } = require('child_process');

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
process.exitCode = spawnSync('npm', ['test']).status;
console.log(head);
