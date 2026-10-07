#!/usr/bin/env node
'use strict'

// PostToolUse hook for Edit and Write: formats the edited file with the project's own
// formatter, and only when the project clearly uses it. Never uses the network
// (no npx) and never goes through a shell, so file names cannot inject commands.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { readInput } = require('../lib/hook-io')

const TIMEOUT_MS = 20000
const PRETTIER_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css'])
const KOTLIN_EXTENSIONS = new Set(['.kt', '.kts'])

function findUp(startDir, names) {
  let dir = startDir
  for (;;) {
    const hit = names.find((n) => fs.existsSync(path.join(dir, n)))
    if (hit) return path.join(dir, hit)
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function run(command, args) {
  try {
    execFileSync(command, args, { timeout: TIMEOUT_MS, stdio: 'ignore' })
  } catch {
    // Missing tool or formatter error: formatting is best effort and must not fail the edit.
  }
}

function projectUsesRuff(dir) {
  if (findUp(dir, ['ruff.toml', '.ruff.toml'])) return true
  const pyproject = findUp(dir, ['pyproject.toml'])
  return Boolean(pyproject) && fs.readFileSync(pyproject, 'utf8').includes('[tool.ruff')
}

function projectUsesKtlint(dir) {
  const build = findUp(dir, ['build.gradle.kts', 'build.gradle', 'settings.gradle.kts'])
  return Boolean(build) && /ktlint/i.test(fs.readFileSync(build, 'utf8'))
}

function localPrettier(dir) {
  const pkgDir = findUp(dir, ['node_modules'])
  if (!pkgDir) return null
  const bin = path.join(pkgDir, 'prettier', 'bin', 'prettier.cjs')
  return fs.existsSync(bin) ? bin : null
}

function main() {
  const input = readInput()
  const file = input.tool_input && input.tool_input.file_path
  if (typeof file !== 'string' || !fs.existsSync(file)) return

  const ext = path.extname(file).toLowerCase()
  const dir = path.dirname(path.resolve(file))

  if (ext === '.py' && projectUsesRuff(dir)) {
    run('ruff', ['format', file])
  } else if (PRETTIER_EXTENSIONS.has(ext)) {
    const prettier = localPrettier(dir)
    if (prettier) run(process.execPath, [prettier, '--write', file])
  } else if (KOTLIN_EXTENSIONS.has(ext) && projectUsesKtlint(dir)) {
    run('ktlint', ['-F', file])
  }
}

try {
  main()
} catch {
  // Never fail the session because of formatting.
}
