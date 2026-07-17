// Type shim for the deep import of elkjs' bundled (main-thread) build.
declare module "elkjs/lib/elk.bundled.js" {
  export interface ElkPoint {
    x: number;
    y: number;
  }

  export interface ElkLabel {
    text: string;
    width?: number;
    height?: number;
  }

  export interface ElkEdgeSection {
    startPoint: ElkPoint;
    endPoint: ElkPoint;
    bendPoints?: ElkPoint[];
  }

  export interface ElkExtendedEdge {
    id: string;
    sources: string[];
    targets: string[];
    sections?: ElkEdgeSection[];
    container?: string;
  }

  export interface ElkNode {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    labels?: ElkLabel[];
    layoutOptions?: Record<string, string>;
    children?: ElkNode[];
    edges?: ElkExtendedEdge[];
  }

  export default class ELK {
    constructor(options?: Record<string, unknown>);
    layout(graph: ElkNode, options?: Record<string, unknown>): Promise<ElkNode>;
  }
}
