---
name: relay-contract-files-missing
description: Teknesyum-UI has no .claude/relay/contracts/ directory — T0 hands contracts inline in the task message, so builders cannot update contract status.
metadata:
  type: project
---

Teknesyum-UI's relay root (`.claude/relay/`) holds only `LOG.md`, `kapsam.json`, `live/`
and `audits/`. There is no `contracts/` directory, and T0 passes the whole contract body
inline in the task prompt instead of a canonical path.

**Why:** the rebuild was split out of Teknesyum-Base and T0 never created the contracts
directory here; three contracts in a row (G2, I, J) hit the same gap.

**How to apply:** do not block on a missing contract file. Proceed from the inline
definition, append one line to `.claude/relay/live/_sorun.log` recording that the contract
file could not be found, and add the delivery line to `.claude/relay/LOG.md` at the end.
