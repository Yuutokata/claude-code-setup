#!/usr/bin/env node
'use strict'

// PreToolUse hook for Bash and PowerShell.
//  1. Blocks dangerous commands that slip past the permission rules.
//  2. Before `git commit`, scans the changes about to be committed for secrets.
// Exit 2 blocks the call and sends stderr to the model. Any internal error exits 0
// so a bug in this guard never locks the session.

const fs = require('fs')
const { execFileSync } = require('child_process')
const { readInput, block } = require('../lib/hook-io')
const { findDanger } = require('../lib/danger-patterns')
const { scanDiff, scanLines, forbiddenFileFinding } = require('../lib/secret-scan')

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
const MAX_UNTRACKED_BYTES = 256 * 1024

const isGitCommit = (c) => /\bgit\b[^\n;&|]*\bcommit\b/.test(c)
const stagesEverything = (c) => /\bgit\b[^\n;&|]*\badd\b/.test(c) || /\bcommit\b[^\n;&|]*\s-[a-zA-Z]*a/.test(c) || /\bcommit\b[^\n;&|]*\s--all\b/.test(c)

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] })
}

function hasHead(cwd) {
  try {
    git(['rev-parse', '--verify', 'HEAD'], cwd)
    return true
  } catch {
    return false
  }
}

function scanUntracked(cwd) {
  const names = git(['ls-files', '--others', '--exclude-standard'], cwd).split('\n').filter(Boolean)
  return names.flatMap((name) => {
    const findings = forbiddenFileFinding(name)
    try {
      const full = `${cwd}/${name}`
      if (fs.statSync(full).size > MAX_UNTRACKED_BYTES) return findings
      const text = fs.readFileSync(full, 'utf8')
      if (text.includes('\u0000')) return findings
      const lines = text.split('\n').map((t, i) => ({ no: i + 1, text: t }))
      return [...findings, ...scanLines(name, lines)]
    } catch {
      return findings
    }
  })
}

function collectFindings(command, cwd) {
  const everything = stagesEverything(command)
  const base = everything ? (hasHead(cwd) ? 'HEAD' : EMPTY_TREE) : null
  const diffArgs = base ? ['diff', base, '-U0', '--no-color'] : ['diff', '--cached', '-U0', '--no-color']
  const nameArgs = base ? ['diff', base, '--name-only'] : ['diff', '--cached', '--name-only']
  const names = git(nameArgs, cwd).split('\n').filter(Boolean)
  return [
    ...names.flatMap(forbiddenFileFinding),
    ...scanDiff(git(diffArgs, cwd)),
    ...(everything ? scanUntracked(cwd) : []),
  ]
}

function main() {
  const input = readInput()
  const command = input.tool_input && input.tool_input.command
  if (typeof command !== 'string' || !command) return

  const danger = findDanger(command)
  if (danger) block([`Blocked by bash-guard: ${danger.name}.`, danger.hint])

  if (!isGitCommit(command)) return
  let findings = []
  try {
    findings = collectFindings(command, input.cwd || process.cwd())
  } catch {
    return
  }
  if (findings.length === 0) return
  block([
    'Blocked by bash-guard: possible secrets in the changes to be committed (values are not shown):',
    ...findings.slice(0, 20).map((f) => `  - ${f.file}${f.line ? `:${f.line}` : ''}  ${f.name}`),
    'Remove them, load them from environment variables (Phase/.env), and rotate any secret that was ever pushed.',
    'For an intentional test fixture, add the comment "secret-scan:allow" on that line.',
  ])
}

try {
  main()
} catch (error) {
  process.stderr.write(`bash-guard internal error (ignored): ${error && error.message}\n`)
}
