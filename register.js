// otellocal/register.js
//
// Zero-boilerplate OpenTelemetry setup for otellocal.
// Usage:
//   node --import otellocal/register app.js
//
// Optional env vars:
//   OTEL_SERVICE_NAME   - name shown in the UI (defaults to your package.json "name", or "app")
//   OTELLOCAL_URL        - collector traces endpoint (defaults to http://localhost:4318/v1/traces)

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const OTEL_URL = process.env.OTELLOCAL_URL || 'http://localhost:4318/v1/traces'
const SERVICE_NAME =
  process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || 'app'

const exporter = new OTLPTraceExporter({ url: OTEL_URL })

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: SERVICE_NAME }),
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()

console.log(`[otellocal/register] tracing "${SERVICE_NAME}" -> ${OTEL_URL}`)

process.on('SIGTERM', () => sdk.shutdown().catch(() => {}))
process.on('SIGINT', () => sdk.shutdown().catch(() => {}))