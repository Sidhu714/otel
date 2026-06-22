import  {test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { recordSample,getAllStats,resetAnalyzer,analyzeSpan } from '../src/analyzer.js';


beforeEach(() => {
    resetAnalyzer()
})

test("recordSample stores samples",() => {
    
    recordSample("db:query",45)
    recordSample("db:query",50)

    const stats = getAllStats();

    assert.equal(stats["db:query"].count,2)
})


test("analyzeSpan flags slow span after enough samples",() => {

   for(let i = 0; i < 100; i++){
        recordSample("db.query",50)
   }

   const result = analyzeSpan('db.query', 500);


   assert.equal(result.isSlow, true);
   assert.ok(result.p95 > 0);
   assert.ok(result.avgMs > 0);

})




test('analyzeSpan does not flag a normal span', () => {
    for (let i = 0; i < 100; i++) {
        recordSample('db.query', 50);
    }

    // 50ms is right at the baseline, definitely not slow
    const result = analyzeSpan('db.query', 50);

    assert.equal(result.isSlow, false);
});


test('analyzeSpan returns isSlow false when below window size', () => {
    recordSample('db.query', 50);
    recordSample('db.query', 60);
    // only 2 samples — well below WINDOW_SIZE of 100

    const result = analyzeSpan('db.query', 9999); // absurdly high duration

    // should still return false — not enough data to judge
    assert.equal(result.isSlow, false);
});