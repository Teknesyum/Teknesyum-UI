---
name: bash-heredoc-backslashes
description: Bash heredocs in this environment strip backslashes, so never write regex or escape-heavy code through one; use the Write tool plus a splice script.
metadata:
  type: feedback
---

Never pipe escape-heavy code (regex literals, `\s`, `\n`, `\b`) into a file through a Bash
heredoc here — even a quoted `<<'EOF'`. The backslashes are eaten, so `/git\s+push/` lands
as `/gits+push/` and the file stops parsing.

**Why:** hit twice while adding `IRREVERSIBLE_COMMANDS` to `Teknesyum-Core/core/scripts/risk.js`;
both attempts produced a `SyntaxError: Invalid regular expression` from mangled source.

**How to apply:** write the new code to a scratchpad file with the Write tool, then splice it
into the target with a small `node -e` script that reads both files by path. The same applies
to the Edit tool afterwards — once a file has been mangled, the old_string you remember no
longer matches, so rewrite the whole file with Write instead.
