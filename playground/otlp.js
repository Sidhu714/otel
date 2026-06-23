import { parseOtlpJson } from "../src/otlp-parser.js";


const body = {
  resourceSpans: [
    {
      resource: {
        attributes: [
          {
            key: "service.name",
            value: { stringValue: "my-app" }
          }
        ]
      },
      scopeSpans: [
        {
          spans: [
            {
              traceId: "abc123",
              spanId: "111",
              parentSpanId: "",
              name: "GET /users",
              startTimeUnixNano: "1000",
              endTimeUnixNano: "2000",
              attributes: [],
              status: { code: 0 },
              events: []
            }
          ]
        }
      ]
    }
  ]
};


console.log(parseOtlpJson(JSON.stringify(body)));
