<p align="center">
  <img src="docs/assets/banner.svg" alt="claude-code-setup: one Claude Code setup, synced between my desktop and my MacBook" width="100%">
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
  <img alt="Platforms: Windows and macOS" src="https://img.shields.io/badge/platforms-Windows%20%7C%20macOS-lightgrey?style=flat-square">
  <img alt="Hooks written in Node.js" src="https://img.shields.io/badge/hooks-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="Claude Code" src="https://img.shields.io/badge/Claude_Code-setup-D97757?style=flat-square&logo=anthropic&logoColor=white">
</p>

<p align="center">
  <img alt="Kotlin" src="https://img.shields.io/badge/Kotlin-7F52FF?style=flat-square&logo=kotlin&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white">
</p>

<p align="center">
  <a href="docs/reference.md">Reference</a> ·
  <a href="docs/bash-guard.md">Command guard</a> ·
  <a href="skills/README.md">Skills</a> ·
  <a href="LICENSE">License</a>
</p>

My Claude Code configuration: rules, subagents, hooks and permissions for a backend-heavy stack (Kotlin with Ktor, Python with FastAPI, MongoDB, Docker on a small VPS) with a React and Tailwind frontend on the side. It is the `~/.claude` directory I use every day, cleaned up so it can be shared.

> [!NOTE]
> I'm publishing this to be read and borrowed from, not installed as it is. The permissions, plugin choices and some paths are mine, and you will want your own. It is an independent personal project and is not affiliated with or endorsed by Anthropic.

## 🎯 Why I built it

I work on two machines: a Windows desktop at home and a MacBook when I'm on the go. I wanted Claude Code to behave exactly the same on both. Same rules, same subagents, same permissions, same hooks, without rebuilding anything by hand and without wondering why a command is allowed on one machine and blocked on the other.

So the whole `~/.claude` directory is a git repository. A hook pulls it when a session starts, and another one commits and pushes it when the session ends. If I change a rule on the desktop, the MacBook has it the next time I open Claude Code.

```mermaid
flowchart LR
    D["Desktop at home"] <-->|"session start: pull<br/>session end: push"| R[("Private config repo")]
    R <-->|"session start: pull<br/>session end: push"| M["MacBook on the go"]
```

Two things followed from that:

- **One setup, two operating systems.** The hooks are plain Node scripts that never go through a shell, and the permission rules exist for both the Bash and the PowerShell tool, so nothing depends on which machine I'm sitting at.
- **An unattended push has to be safe.** A hook that publishes on its own is only as safe as what it is allowed to publish. The `.gitignore` is a whitelist (everything is ignored unless I list it), and every auto-sync commit goes through a secret scan first.

This repository is a cleaned copy of that private one, without my skills and without anything personal.

## 📦 What's inside

| | |
|---|---|
| 📌 `CLAUDE.md` | Short global preferences: stack, tooling, how I want GitHub handled. |
| 📏 `rules/` | Nine rules. Four general ones are always loaded; five are per-stack (Python, Kotlin, MongoDB, Docker, frontend) and load only when a matching file is touched. |
| 🤖 `agents/` | Nine subagents: planner, architect, code and security reviewers, a test-first guide, and a few for builds, cleanup, E2E and docs. |
| ⌨️ `commands/` | Eleven slash commands, such as `/plan`, `/verify` and `/build-fix`. |
| 🪝 `scripts/` | Node hooks that guard commands, scan for secrets, format edited files and keep the config synced. |
| ⚙️ `settings.json` | Permissions (deny, ask, allow), hook wiring, plugins and model settings. |

## 💡 Ideas worth borrowing

**Keep the always-loaded part small.** `CLAUDE.md` and the four general rules come to about 2k tokens. Anything stack-specific lives in a rule with a `paths:` list in its frontmatter, so the Python rules cost nothing while I'm working on a Kotlin service.

**Write hooks in Node, without a shell.** The same scripts run on Windows and macOS. `bash-guard.js` blocks the usual disasters (force pushes, recursive deletes of root-like paths, `curl | sh`, dropping a database) and scans the staged changes for secrets before every `git commit`. It reports file, line and pattern, never the value. [How it works](docs/bash-guard.md).

**Make auto-sync fail closed.** Because the session-end commit would bypass the guard above, `secret-gate.js` runs the same scanner first. If it finds something, or breaks, the sync is skipped and nothing leaves the machine.

**Order permissions as deny, ask, allow.** Destructive and outward-facing commands ask first, routine safe ones run without a prompt, and secrets are off limits. Pattern matching on command text is not a security boundary, which is why the hook above exists as a second layer.

**Pick the model per job.** Opus for planning and architecture, Haiku for documentation, Sonnet for everything else, using aliases instead of pinned model IDs so the setup does not go stale.

## 🔌 How the hooks fit together

```mermaid
flowchart LR
    S([Session starts]) -->|sync.sh| P[Pull the config repo]
    P --> W[Working session]
    W -->|Bash or PowerShell command| G[bash-guard.js]
    W -->|Edit or Write| F[format-on-edit.js]
    W -->|Prompt or idle| N[notify.js]
    W --> E([Session ends])
    E -->|push.sh| SG[secret-gate.js]
    SG -->|clean| C[Commit and push]
    SG -->|secret found| K[Skip the sync]
```

## 🛡️ See it work

This is the output of `bash-guard.js`, rendered from a real run. Each command is sent to the hook the way Claude Code would send it, and the third one commits a file that contains a fake token.

<p align="center">
  <img src="docs/assets/guard-demo.svg" alt="Terminal output of bash-guard.js blocking a force push, a recursive delete and a commit that contains a token" width="760">
</p>

The message goes back to Claude, so it usually reacts by choosing a safer command or asking me, instead of retrying the same one.

<details>
<summary>Text version of the same run</summary>

```
$ git push --force origin main
Blocked by bash-guard: force push.
Force pushes rewrite shared history. Ask the user to run it themselves.
[exit 2]

$ rm -rf ~
Blocked by bash-guard: recursive delete of a root-like path.
Delete a specific subdirectory instead.
[exit 2]

$ git commit -m "add config"
Blocked by bash-guard: possible secrets in the changes to be committed (values are not shown):
  - config.py:1  GitHub token
Remove them, load them from environment variables (Phase/.env), and rotate any secret that was ever pushed.
For an intentional test fixture, add the comment "secret-scan:allow" on that line.
[exit 2]

$ git status
[exit 0]
```

</details>

## 🗂️ Layout

```
.
├── CLAUDE.md          global preferences, always loaded
├── settings.json      permissions, hooks, plugins, model
├── rules/             general rules, plus per-stack rules scoped with paths:
├── agents/            subagents
├── commands/          slash commands
├── scripts/
│   ├── hooks/         bash-guard, secret-gate, format-on-edit, notify, sync, push
│   └── lib/           shared helpers and the secret scanner
├── docs/
│   ├── assets/        banner and terminal image
│   ├── bash-guard.md  how the command guard and secret scan work
│   └── reference.md   every rule, agent, command and hook in detail
└── skills/            list of the skills I use (not included)
```

## 🚀 Using it

Read before you copy. The rules and agents are the easiest parts to reuse; start there and cut whatever does not match your stack.

Try the guard before you register it. Run this in a normal terminal, not through Claude with the hook enabled, because the guard would block the command that contains the test string. It should print `2`:

```sh
node -e "
const { spawnSync } = require('child_process');
const command = 'git push --' + 'force';
const r = spawnSync('node', ['scripts/hooks/bash-guard.js'], { input: JSON.stringify({ tool_input: { command } }), encoding: 'utf8' });
console.log(r.status);"
```

> [!WARNING]
> `sync.sh` and `push.sh` are written for my own setup and will not work for you as they are. They hardcode my private config repository, the branch `master` and the directory `$HOME/.claude`. Change those variables or leave the two hooks out of `settings.json`. `push.sh` commits and pushes everything your `.gitignore` allows, so keep the whitelist and the secret gate in place if you use it.

The full details, including the permission lists, the hook behaviour and how I set up a new machine, are in [`docs/reference.md`](docs/reference.md).

## 📄 Credits and license

My own work here is released under the [MIT License](LICENSE). It comes with no warranty, so read any hook that runs commands or pushes to git before you enable it.

Parts of `agents/` and `commands/` started from [everything-claude-code](https://github.com/affaan-m/ECC) by Affaan Mustafa, which is also MIT licensed. Its notice is kept in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). The skills I use belong to their authors and are not included; [`skills/README.md`](skills/README.md) lists them with their licenses.
