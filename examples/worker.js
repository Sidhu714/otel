import './tracing.js'

import { Worker } from 'bullmq'

import {
  trace,
  context,
  propagation,
  SpanStatusCode,
} from '@opentelemetry/api'

const tracer = trace.getTracer('payment-worker')

const worker = new Worker(
  'payment-queue',

  async job => {

    console.log('[worker] received job:', job.name)

    console.log(
      '[worker] received trace context:',
      job.data.traceContext
    )

    // ------------------------------------
    // EXTRACT TRACE CONTEXT
    // ------------------------------------

    const parentContext = propagation.extract(
      context.active(),
      job.data.traceContext
    )

    // ------------------------------------
    // CREATE CHILD SPAN
    // ------------------------------------

    const span = tracer.startSpan(
      'payment.charge',
      {
        attributes: {
          'service.name': 'payment-service',
          'job.id': job.id,
        },
      },
      parentContext
    )

    try {

      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      )

      span.setStatus({
        code: SpanStatusCode.OK,
      })

      console.log('[worker] payment completed')

    } catch (err) {

      span.recordException(err)

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      })

      throw err

    } finally {
      span.end()
    }
  },

  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
)

console.log('[worker] payment worker started')