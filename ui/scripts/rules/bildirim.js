'use strict';

const SOURCE = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.svelte', '.html', '.cs', '.xaml', '.axaml', '.rs', '.py'];
const KEY_FILES = SOURCE.concat(['.json', '.yml', '.yaml', '.toml', '.ps1', '.bat', '.cmd', '.csproj', '.targets', '.props', '.env']);
const ISSUE_LINK = /github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+\/issues\/new\b/;
const TOKEN = /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})/;

module.exports = {
  id: 'bildirim',

  lineRules: [
    {
      id: 'public-issue-link',
      severity: 'error',
      exts: SOURCE,
      test(line) {
        if (ISSUE_LINK.test(line))
          return 'A "new issue" link sends the user to a public page and asks for a GitHub account: send the note from inside the app (scaffold.js bildirim).';
        return null;
      },
    },
    {
      id: 'key-in-source',
      severity: 'error',
      exts: KEY_FILES,
      test(line) {
        if (TOKEN.test(line))
          return 'A GitHub token is written in the source: read it from the environment at build time (TEKNESYUM_BILDIRIM_KEY) and revoke this one.';
        return null;
      },
    },
  ],
};
