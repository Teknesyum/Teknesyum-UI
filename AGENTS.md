# Teknesyum UI

The plugin lives in `ui/`, its scripts in `ui/scripts/`, its templates in `ui/templates/`.
Tests: `npm test`.

Logs about this plugin land in `logs/openlogs/` (gitignored), written by Core's
`log.js write` when the title or symptom names teknesyum-ui or one of its scripts, or with
`--to ui`. List them with Core's `log.js list`; close with `log.js archive --id <slug>`,
which moves the log to `logs/openlogs/closed/`.
