import { analyzeSpan,getAllStats,recordSample,resetAnalyzer } from "../analyzer.js";

for(let i = 0; i <= 100; i++){
        recordSample("db:query",50)
   }

const stats = getAllStats();


console.log("the stats are",stats)


console.log(analyzeSpan("db:query", 500));