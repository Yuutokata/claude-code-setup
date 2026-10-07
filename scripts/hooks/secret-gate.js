'use strict'

// Called by push.sh before the auto-sync commit. Scans what is staged in the current
// repository and exits 1 when it finds a secret or a forbidden file, so nothing gets
// committed or pushed. Unlike bash-guard.js this fails closed: an internal error also
// exits 1, because the cost of a wrong "allow" here is a published secret.
// Output names file, line and pattern only, never the value.

const { execFileSync } = require('child_process')
const { scanDiff, forbiddenFileFinding } = require('../lib/secret-scan')

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

try {
  const files = git(['diff', '--cached', '--name-only', '--diff-filter=AM']).split('\n').filter(Boolean)
  const findings = [
    ...files.flatMap(forbiddenFileFinding),
    ...scanDiff(git(['diff', '--cached', '-U0', '--no-color'])),
  ]
  if (findings.length === 0) process.exit(0)

  const lines = findings.map((f) => `  ${f.file}${f.line ? `:${f.line}` : ''} (${f.name})`)
  process.stderr.write(`secret-gate: blocked auto-sync, possible secrets staged:\n${lines.join('\n')}\n`)
  process.exit(1)
} catch (err) {
  process.stderr.write(`secret-gate: scan failed, blocking auto-sync (${err.message})\n`)
  process.exit(1)
}
