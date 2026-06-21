export type SpanStatus = {
  code?: number
}

export type SpanAnalysis = {
  isSlow?: boolean
  ratio?: number
  p95?: number
  avgMs?: number
  sampleCount?: number
}


export type Log = {
  spanId?: string | null
  severityText?: string
  body?: string
  timestampMs: number
}



export type SpanDetailProps = {
  trace: Trace
}

export type SpanBlockProps = {
  span: Span
  logs: Log[]

}

export type Props = {
  traces: Trace[];
  selected: Trace | null;
  filter: string;
  onFilter: (value: string) => void;
  onSelect: (traceId: string) => void;
};

// export type Span = {
//   spanId: string;
//   parentSpanId?: string | null;
//   name: string;
//   startMs: number;
//   durationMs: number;
// };

// export type Trace = {
//   traceId: string;
//   startMs: number;
//   durationMs: number;
//   spans?: Span[];
// };

export type Trace = {
  traceId: string;
  rootName: string;
  service: string;
  startMs: number;
  durationMs: number;
  spanCount? : number;
  hasError?: boolean
  [key: string]: any;
  spans?: Span[];
  
};

export  type Span = {
  spanId: string
  parentSpanId?: string | null
  name: string
  durationMs: number
  service?: string
  status?: SpanStatus
  attributes?: Record<string, unknown>
  analysis?: SpanAnalysis
  startMs: number;
}



export type FlameGraphProps = {
  trace: Trace;
};

// export type SpanStatus = {
//   code?: number
// }


// type SpanAnalysis = {
//   isSlow?: boolean
//   p95?: number
//   avgMs?: number
//   ratio?: number
// }

// type Span = {
//   spanId: string
//   parentSpanId?: string | null
//   name: string
//   startMs: number
//   durationMs: number
//   status?: SpanStatus
//   attributes?: Record<string, unknown>
//   analysis?: SpanAnalysis
// }

// type Trace = {
//   traceId: string
//   startMs: number
//   durationMs: number
//   spans?: Span[]
//   hasError?: boolean
// }

export type TimelineProps = {
  trace: Trace
}

export type TopBarProps = {
    connected : boolean;
    onClear : () => void;
}

type GraphNode = {
  id: string
  service: string
  spanCount: number
  errorCount: number
}

export type GraphEdge = {
  source: string | GraphNode
  target: string | GraphNode
  count: number
  errorRate: number
  avgMs: number
}

export type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type SimNode = GraphNode & d3.SimulationNodeDatum

export type SimEdge = d3.SimulationLinkDatum<SimNode> & {
  count: number
  errorRate: number
  avgMs: number
}
