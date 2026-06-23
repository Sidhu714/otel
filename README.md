![CI](https://github.com/Sidhu714/otel/actions/workflows/ci.yml/badge.svg)

# otellocal

A zero-config, local-first OpenTelemetry collector with a built-in UI. Point your app at it, see your traces — no signup, no SaaS account, no infrastructure to stand up.

This is a personal project built to learn the OpenTelemetry protocol and tracing internals from the ground up, by implementing a collector instead of just consuming one.

## Why

Most OTel backends (Jaeger, Zipkin, vendor SaaS) want you to either run a multi-container stack or sign up for a hosted account before you can see a single trace. `otellocal` is meant for the "I just want to see what my requests are doing right now, on my machine, in the next 30 seconds" case — local development and debugging, not production observability.

## Features

- **Trace waterfall view** — see the full span tree for any request, with timing laid out visually
- **Flame graph** — spot where time is actually being spent across nested spans
- **Service dependency graph** — auto-built from observed traces, shows which services call which
- **Slow-span detection** — flags spans that are running slower than their own historical p95, not just an arbitrary fixed threshold
- **Live updates over WebSocket** — traces appear as they arrive, no manual refresh
- **In-memory storage** — no database to install; traces are kept for 30 minutes / last 200 traces and then evicted, by design (this is a debugging tool, not a long-term store)
- **OTLP/HTTP receiver** — works with the standard OpenTelemetry SDKs, no proprietary instrumentation needed

## Quickstart

```bash
npx otellocal
```

This starts:
- the OTLP receiver on `http://localhost:4318`
- the UI + API on `http://localhost:4320`

Open `http://localhost:4320` in your browser.

In the app you want to trace, point its OTel exporter at the collector:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/json
```

Send some traffic to your app, and traces will show up live in the UI.

### Try it without an app to instrument

```bash
npx otellocal --demo
```

This starts the collector and feeds it a stream of synthetic traces so you can explore the UI immediately, without wiring up real instrumentation first.

## Installation

**Run directly (recommended):**
```bash
npx otellocal
```

**Or install globally:**
```bash
npm install -g otellocal
otellocal
```

**Or clone and run from source:**
```bash
git clone https://github.com/Sidhu714/otel.git
cd otel
npm install
npm run build   # builds the UI
npm start
```

## Configuration

Set these as environment variables if you need non-default ports:

| Variable | Default | Description |
|---|---|---|
| `OTLP_HTTP_PORT` | `4318` | Port the OTLP/HTTP receiver listens on |
| `API_PORT` | `4320` | Port the UI + REST API + WebSocket server listens on |

## API

The UI talks to a small REST API, also usable directly:

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/traces` | List all currently stored traces (summary view) |
| `GET` | `/api/trace/:traceId` | Full detail for a single trace, including all spans and logs |
| `DELETE` | `/api/traces` | Clear all stored traces |
| `GET` | `/api/stats` | Per-operation timing stats (avg, min, max, p95, sample count) |
| `GET` | `/api/graph` | Service dependency graph, derived from observed traces |

## How it works

`otellocal` runs two HTTP servers:

1. An **OTLP/HTTP receiver** (`/v1/traces`, `/v1/metrics`, `/v1/logs`) that accepts standard OpenTelemetry protocol payloads from any OTel SDK.
2. An **API + UI server** that serves the built React frontend, exposes the REST API above, and pushes live trace updates to connected browsers over WebSocket.

Traces are held in an in-memory store with a rolling eviction policy (oldest traces dropped after 30 minutes or once 200 traces are held) — there's no database. Slow-span detection works by keeping a rolling window of the last 100 durations per operation name and comparing each new span against that operation's own p95, so "slow" is relative to that specific endpoint's normal behavior rather than a single global threshold.

## Project structure

```
otel/
├── bin/             # CLI entry point
├── src/             # collector + API server (Node/Express)
├── ui/              # React frontend (Vite)
└── examples/        # a minimal instrumented app to try it against
```

## Status

This is an early, actively developed project (`0.x`) — APIs, ports, and behavior may change between versions. Feedback and issues are welcome at [github.com/Sidhu714/otel/issues](https://github.com/Sidhu714/otel/issues).

## License

MIT
