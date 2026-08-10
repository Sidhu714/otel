import { context, propagation } from "@opentelemetry/api";

export function injectTraceContext() {
    const carrier = {};

    propagation.inject(context.active(), carrier)

    return carrier;

}

export function runWithTraceContext(carrier, fn) {
    const ctx = propagation.extract(context.active(), carrier || {})
    return context.with(ctx, fn)
}