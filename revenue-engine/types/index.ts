/**
 * Type definitions for DESRG system
 * TypeScript support for better IDE autocomplete and type safety
 */

export interface Position {
  x: number;
  y: number;
}

export interface Metrics {
  [key: string]: string | number;
}

export interface Node {
  id: string;
  type: 'traffic' | 'landing_page' | 'checkout' | 'upsell' | 'custom';
  label: string;
  position: Position;
  metrics?: Metrics;
}

export interface Edge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  isActive: boolean;
}

export interface FunnelState {
  nodes: Node[];
  edges: Edge[];
  timestamp?: string;
}

export interface FunnelContextType {
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: string | null;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  dragNode: (id: string, x: number, y: number) => void;
  finalizeDrag: () => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  setEdgeActive: (id: string, isActive: boolean) => void;
  generateReport: (options?: ReportOptions) => Promise<ReportResult>;
  exportState: () => FunnelState;
  importState: (state: FunnelState) => void;
}

export interface ReportOptions {
  includeMetrics?: boolean;
  includePredictions?: boolean;
  reportFormat?: 'json' | 'html' | 'pdf';
  destination?: 'console' | 'email' | 'slack' | 'storage';
  branch?: string;
}

export interface ReportResult {
  success: boolean;
  runId?: string;
  url?: string;
  error?: string;
  timestamp: string;
}

export interface WebhookPayload {
  event_type: string;
  timestamp: string;
  funnelState: FunnelState;
  config: Record<string, any>;
}
