import { createTraceState } from "@opentelemetry/api"

const storeA = createTraceState();
const storeB = createTraceState();


console.log(storeA === storeB)