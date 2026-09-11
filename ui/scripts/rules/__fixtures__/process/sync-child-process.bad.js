const { app } = require('electron');
const { execFileSync } = require('child_process');

app.whenReady().then(() => execFileSync('git', ['pull']));
