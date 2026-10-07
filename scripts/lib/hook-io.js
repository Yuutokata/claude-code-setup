'use strict'

const fs = require('fs')

/** Read the hook payload from stdin. Returns {} when stdin is empty or not JSON. */
function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8')
    return raw.trim() ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** Block the tool call: stderr is fed back to the model, exit code 2 denies the action. */
function block(lines) {
  process.stderr.write(`${[].concat(lines).join('\n')}\n`)
  process.exit(2)
}

module.exports = { readInput, block }
