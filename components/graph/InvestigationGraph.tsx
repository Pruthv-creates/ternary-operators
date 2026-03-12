'use client';

import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 5 }, data: { label: 'Document: FinancialRecord_Q3.pdf' }, type: 'input' },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'Entity: ABC Holdings (Organization)' } },
  { id: '3', position: { x: 400, y: 100 }, data: { label: 'Summary: Q3 Transfers' } },
  { id: '4', position: { x: 250, y: 200 }, data: { label: 'Conjecture: ABC Holdings may be a shell company' } },
  { id: '5', position: { x: 250, y: 300 }, data: { label: 'Task: Check corporate registry for ABC Holdings' }, type: 'output' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', label: 'mentions', animated: true },
  { id: 'e1-3', source: '1', target: '3', label: 'summarized_from' },
  { id: 'e2-4', source: '2', target: '4', label: 'suggests' },
  { id: 'e4-5', source: '4', target: '5', label: 'investigate_next', animated: true },
];

export default function InvestigationGraph() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
