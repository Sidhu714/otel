/**
 * analyser.js — detects anomalously slow spans
 *
 * Keeps a rolling window of duration samples per span name.
 * When a new span comes in, compares it against the historical
 * p95 for that operation name.
 *
 * Why p95 and not average?
 *   Average is skewed by outliers. p95 means "95% of the time
 *   this span finishes under X ms" — much more meaningful.
 */


const WINDOW_SIZE  = 100   // keep last 100 samples per span name
const SLOW_FACTOR  = 2.0   // flag if duration > 2x the p95
const MIN_SAMPLES  = 5     // don't flag until we have enough history


const history = new Map();

//Example

// Map {
//   "GET /api/user" => [120, 110, 130],
//   "db.query"      => [45, 50, 47],
//   "auth.validate" => [10, 12, 9]
// }

export function recordSample(spanName,durationMs){
    if(!history.has(spanName)) history.set(spanName,[])
    
    const samples = history.get(spanName)
    samples.push(durationMs)

     // Keep only the last WINDOW_SIZE samples

    if (samples.length > WINDOW_SIZE) samples.shift()
}

export function analyzeSpan(spanName,durationMs){
    const samples = history.get(spanName) ?? [];

    if(samples.length < WINDOW_SIZE){
        return {
            isSlow : false,
            p95 : null,
            avgMs : null,
            ratio : null,
            sampleCount : samples.length
        }
    }

    const p95 = calcP95(samples);
    const avgMs = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
    const ratio = durationMs / p95

    return {
        isSlow :  ratio > SLOW_FACTOR,
        p95:         Math.round(p95),
        avgMs,
        ratio:       Math.round(ratio * 10) / 10,
        sampleCount: samples.length,

    }
}



export function getAllStats(){
    const out = {}
    for(const [name,samples] of history){
        if(samples.length < 2) continue

        out[name] = {
            p95:    Math.round(calcP95(samples)),
            avg:    Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
            min:    Math.round(Math.min(...samples)),
            max:    Math.round(Math.max(...samples)),
            count:  samples.length,
        }
    }
    return out
}


export function resetAnalyzer(samples){
    history.clear()
}

// Example

// samples = [120, 110, 130, 125, 140, 150, 300]
// sorted = [110, 120, 125, 130, 140, 150, 300]
// idx = Math.floor(7 * 0.95)
//     = Math.floor(6.65)
//     = 6
// sorted[6] = 300    


function calcP95(samples){
    const sorted = [...samples].sort((a,b) => a - b);
    const idx = Math.floor(sorted.length * 0.95);

    return sorted[Math.min(idx,sorted.length - 1)];


}
















// # `recordSample(spanName, durationMs)`

// ## Purpose

// Stores a duration sample for a span and keeps only the latest `WINDOW_SIZE` samples.

// ---

// ## Parameters

// | Parameter    | Type     | Description                   |
// | ------------ | -------- | ----------------------------- |
// | `spanName`   | `string` | Name of the operation or span |
// | `durationMs` | `number` | Duration in milliseconds      |

// ---

// ## Example

// ### Input

// ```js
// recordSample("db.query", 45)
// recordSample("db.query", 50)
// recordSample("db.query", 47)
// ```

// ### Internal State

// ```js
// Map {
//   "db.query" => [45, 50, 47]
// }
// ```

// ---

// ## Produces

// No return value.

// ```js
// undefined
// ```

// ---

// ## Side Effect

// Updates the internal history map.

// Calling:

// ```js
// recordSample("GET /api/user", 120)
// ```

// changes

// ```js
// Map {}
// ```

// into

// ```js
// Map {
//   "GET /api/user" => [120]
// }
// ```

// ---

// ## Window Behavior

// Assume:

// ```js
// WINDOW_SIZE = 5
// ```

// Current samples:

// ```js
// [120, 110, 130, 125, 140]
// ```

// After:

// ```js
// recordSample("GET /api/user", 150)
// ```

// Temporary array:

// ```js
// [120, 110, 130, 125, 140, 150]
// ```

// Since length exceeds 5, the oldest value is removed:

// ```js
// [110, 130, 125, 140, 150]
// ```

// ---

// ## Summary

// ### Takes

// ```js
// (string, number)
// ```

// Example:

// ```js
// ("db.query", 45)
// ```

// ### Returns

// ```js
// undefined
// ```

// ### Modifies

// ```js
// history : Map<string, number[]>
// ```

// ### Guarantees

// * Creates a new entry if the span doesn't exist.
// * Appends the duration to the span's sample list.
// * Maintains at most `WINDOW_SIZE` samples.
// * Removes the oldest sample when the limit is exceeded.
