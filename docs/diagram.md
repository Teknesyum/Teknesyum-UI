# Diagrams

Every flow the README describes, in one place.

## Token Flow

```mermaid
flowchart LR
  A[Preview App] -->|Kaydet| B[Your Token File]
  B -->|setup.js| C[Project Theme Files]
  C --> D[Code Uses var --tk-*]
  D -->|scan.js| E{Open Findings?}
  E -->|Yes| F[Fix Or --fix]
  F --> D
  E -->|No| G[Check Recorded With Layout Hash]
```

*Figure 1: the preview app saves your token file, setup turns it into the project's theme
files, the code references only tokens, the scanner checks it, and a clean scan records which
layout it was checked against.*

## Hooks

```mermaid
flowchart TD
  S[Session Starts] --> Q1{Project Has UI Files?}
  Q1 -->|No, Not Set Up| N1[Short Note: Set Up Before The First UI File]
  Q1 -->|No, Set Up| Z[Silent]
  Q1 -->|Yes| Q2{Set Up, Checked, Same Layout?}
  Q2 -->|No| N2[Check First: Setup, Scan, Fix, Two-Line Report]
  Q2 -->|Yes| Q3{Open Findings?}
  Q3 -->|Yes| N3[Fix First, Then The Request]
  Q3 -->|No| Z
  W[Write A UI File] --> Q4{Project Set Up?}
  Q4 -->|No| D1[Write Denied Until Setup Runs]
  Q4 -->|Yes| OK[Write Goes Through]
  T[Turn Ends] --> G1[Stop Hook Scans Changed Files]
```

*Figure 2: at session start the hook stays silent on a clean project, leaves a note on a
project with no interface yet, and asks for a check first when a project was never set up,
never checked or its layout changed; writing a UI file is refused until setup has run; the
Stop hook scans what the turn changed.*

## Which Template Setup Uses

```mermaid
flowchart TD
  A[setup.js --apply] --> B{--template Given?}
  B -->|Yes| C[That Template]
  B -->|No| D{Private Shelf Reachable?}
  D -->|No| E[Public Standard: Black, White, Grey]
  D -->|Yes| F{benim.tokens.json Exists?}
  F -->|Yes| G[Your Token File]
  F -->|No| E
```

*Figure 3: setup takes the template you name; otherwise it uses your token file when the
private shelf is reachable and holds one, and the public standard when it does not.*
