'use strict'

// Detects secrets in text that is about to be committed. Findings never contain the
// secret value, only file, line and pattern name, so the report itself cannot leak it.

const ALLOW_MARKER = 'secret-scan:allow'

const PATTERNS = [
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/ },
  { name: 'Anthropic or OpenAI style API key', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{24,}\b/ },
  { name: 'Slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Discord bot token', re: /\b[MNO][A-Za-z0-9_-]{23,27}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b/ },
  { name: 'Phase service token', re: /\bpss_(?:service|user):v\d+:[A-Za-z0-9+/=:_-]{20,}/ },
  { name: 'private key block', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { name: 'connection string with credentials', re: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^\s:@/'"]+:[^\s@/'"]{3,}@/i },
]

const GENERIC = /\b(?:password|passwd|secret|token|api[_-]?key|private[_-]?key)\w*\s*[:=]\s*['"]([^'"\s]{12,})['"]/i
const PLACEHOLDER = /example|changeme|change-me|your[_-]|xxxx|<[^>]+>|\$\{|\{\{|dummy|placeholder|process\.env|os\.environ|getenv/i

const FORBIDDEN_FILE = [
  { name: 'real .env file', re: /(?:^|[\\/])\.env(?:\.(?!example$|sample$|template$)[^\\/]+)?$/ },
  { name: 'key or certificate file', re: /\.(?:pem|key|p12|pfx)$/i },
  { name: 'SSH private key', re: /(?:^|[\\/])id_(?:rsa|ed25519|ecdsa)$/ },
]

function scanLine(text) {
  if (text.includes(ALLOW_MARKER)) return null
  const hit = PATTERNS.find((p) => p.re.test(text))
  if (hit) return hit.name
  const generic = GENERIC.exec(text)
  if (generic && !PLACEHOLDER.test(generic[1]) && !PLACEHOLDER.test(text)) return 'hardcoded secret assignment'
  return null
}

/** lines: [{no, text}] -> findings [{file, line, name}] */
function scanLines(file, lines) {
  return lines.flatMap(({ no, text }) => {
    const name = scanLine(text)
    return name ? [{ file, line: no, name }] : []
  })
}

function forbiddenFileFinding(file) {
  const hit = FORBIDDEN_FILE.find((f) => f.re.test(file))
  return hit ? [{ file, line: 0, name: hit.name }] : []
}

/** Parse `git diff -U0` output into added lines per file and scan them. */
function scanDiff(diff) {
  const findings = []
  let file = ''
  let lineNo = 0
  let added = []
  const flush = () => {
    if (file) findings.push(...scanLines(file, added))
    added = []
  }
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      flush()
      file = raw.slice(4).replace(/^b\//, '').trim()
    } else if (raw.startsWith('@@')) {
      const m = /\+(\d+)/.exec(raw)
      lineNo = m ? Number(m[1]) : 0
    } else if (raw.startsWith('+') && !raw.startsWith('+++')) {
      added.push({ no: lineNo, text: raw.slice(1) })
      lineNo += 1
    }
  }
  flush()
  return findings
}

module.exports = { scanDiff, scanLines, forbiddenFileFinding, ALLOW_MARKER }
