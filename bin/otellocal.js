#!/usr/bin/env node

const args = process.argv.slice(2)

if (args[0] === 'run') {
  const { spawn } = await import('node:child_process')

  const target = args[1]
  if (!target) {
    console.error('Usage: otellocal run <your-app.js>')
    process.exit(1)
  }

  const child = spawn(
    process.execPath,
    ['--import', 'otellocal/register', target, ...args.slice(2)],
    { stdio: 'inherit' }
  )

  child.on('exit', code => process.exit(code ?? 0))
  child.on('error', err => {
    console.error('[otellocal] failed to start app:', err.message)
    process.exit(1)
  })
} else {
  await import('../src/server.js')
}