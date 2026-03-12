# Real-Time Collaboration & State Persistence

This document explains the real-time collaboration and state persistence features implemented for the investigation platform.

## Overview

The investigation platform now supports:

1. **Real-time Collaboration**: Multiple investigators can work on the same case simultaneously and see updates in real-time
2. **State Persistence**: All graph changes (nodes, edges, positions) are automatically saved to the database
3. **Presence Tracking**: See who else is currently viewing the case
4. **Activity Feed**: Track recent changes made by investigators

## Architecture

### Components

#### 1. Real-time Sync Manager (`lib/realtimeSync.ts`)

Manages Supabase WebSocket subscriptions and broadcasting of sync events.

**Key Events:**

- `node-move`: Node position changed
- `node-create`: New node created
- `node-update`: Node data updated
- `node-delete`: Node deleted
- `edge-create`: New edge/connection created
- `edge-delete`: Edge deleted
- `graph-full-update`: Full graph refresh

**Usage:**

```typescript
import { realtimeSyncManager } from "@/lib/realtimeSync";

// Subscribe to events
await realtimeSyncManager.subscribe(caseId, (event) => {
  // Handle event
});

// Broadcast changes
await realtimeSyncManager.broadcast({
  type: "node-move",
  id: nodeId,
  position: { x, y },
});

// Unsubscribe when done
realtimeSyncManager.unsubscribe();
```

#### 2. Investigation Store (`store/investigationStore.ts`)

Zustand store that manages the investigation graph state and integrates with real-time sync.

**Key Functions:**

- `loadCaseData(caseId)`: Loads case data and subscribes to real-time updates
- `handleRemoteEvent(event)`: Processes incoming sync events
- `onNodesChange()`: Handles node changes and broadcasts to other investigators
- `onConnect()`: Persists edge creation and broadcasts
- `deleteNode()`: Deletes node and broadcasts change
- `updateNodeData()`: Updates node and broadcasts change

**Automatic Persistence:**
All mutations automatically:

1. Update local state (optimistic)
2. Persist to database
3. Broadcast to other investigators

#### 3. Database Schema (`prisma/schema.prisma`)

The `Node` and `Edge` models store graph state:

```prisma
model Node {
  id     String @id @default(uuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id])

  type    NodeType
  label   String
  content String?

  positionX Float @default(0)
  positionY Float @default(0)

  edgesOut Edge[] @relation("FromNode")
  edgesIn  Edge[] @relation("ToNode")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Edge {
  id     String @id @default(uuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id])

  sourceId String
  targetId String
  source   Node   @relation("FromNode", fields: [sourceId], references: [id])
  target   Node   @relation("ToNode", fields: [targetId], references: [id])

  relationshipType String

  createdAt DateTime @default(now())

  @@unique([sourceId, targetId, relationshipType])
}
```

#### 4. API Routes

**Nodes** (`app/api/graph/nodes/route.ts`)

- `POST`: Update node data
- `DELETE`: Delete node and related edges

**Edges** (`app/api/graph/edges/route.ts`)

- `POST`: Create new edge
- `DELETE`: Delete edge

#### 5. UI Components

**CollaboratorsIndicator** (`components/CollaboratorsIndicator.tsx`)
Shows active investigators using Supabase presence.

```tsx
import { CollaboratorsIndicator } from "@/components/CollaboratorsIndicator";

<CollaboratorsIndicator caseId={caseId} />;
```

**ActivityFeed** (`components/ActivityFeed.tsx`)
Displays recent changes to the investigation graph.

```tsx
import { ActivityFeed } from "@/components/ActivityFeed";

<ActivityFeed caseId={caseId} />;
```

#### 6. Hooks

**useCollaborators** (`hooks/useCollaborators.ts`)
Hook to track active investigators.

```typescript
const { collaborators, isLoading } = useCollaborators(caseId);
```

## How It Works

### 1. Loading a Case

When an investigator loads a case:

```typescript
// Loads nodes and edges from database
// Subscribes to real-time updates for that case
await store.loadCaseData(caseId);
```

The store:

1. Fetches case graph from database via `getCaseGraph(caseId)`
2. Subscribes to Supabase `case-${caseId}` channel
3. Sets up listeners for all sync events
4. Sets up presence tracking for collaborators

### 2. Making Changes

When an investigator creates/moves/updates nodes or edges:

```typescript
// 1. Optimistic update (instant UI feedback)
set({ nodes: [...nodes, newNode] });

// 2. Persist to database
const result = await createNewNode(caseId, newNode);

// 3. Broadcast to other investigators
if (result.success) {
  await realtimeSyncManager.broadcast({
    type: "node-create",
    node: newNode,
  });
}
```

### 3. Receiving Changes

When another investigator makes changes:

1. Supabase broadcasts the change event
2. `handleRemoteEvent()` processes the event
3. Store state is updated
4. UI re-renders automatically (React reactivity)

### 4. State Persistence

Every change is automatically saved:

- **Node positions**: Saved in `Node.positionX/Y`
- **Node data**: Saved as JSON in `Node.content`
- **Relationships**: Saved in `Edge` table
- **Timestamps**: `updatedAt` tracks changes

Investigators can leave and return later; the full state is restored from the database.

## Data Flow Diagram

```
Investigator A             Database             Investigator B
    |                          |                       |
    |---> Move Node            |                       |
    |                          |                       |
    |---> Save Position ------->|                       |
    |                          |                       |
    |---> Broadcast Event----->|                       |
    |                          |---> Receive Event----->|
    |                          |                       |
    |                          |                       |
    |<--------- Broadcast <-----|<----- Broadcast--------|
    |                          |<----- Update State-----|
    |                          |
    |---> Update State <-----|
    |     (reflect change)      |
```

## Example: Real-Time Collaboration

```typescript
// Investigator A opens the case
const store = useInvestigationStore();
await store.loadCaseData("case-123");

// Investigator B opens the same case
const store2 = useInvestigationStore();
await store2.loadCaseData("case-123");

// Investigator A creates a new node
store.addNode({
  id: "node-1",
  type: "entity",
  position: { x: 100, y: 200 },
  data: { name: "John Doe" },
});

// Database is updated
// ✓ Node-1 created in Nodes table

// Broadcast sent to case-123 channel
// ✓ Event: node-create

// Investigator B receives the event
// ✓ store2.nodes includes the new node
// ✓ UI updates automatically
```

## Deployment Checklist

- [x] Real-time sync manager created
- [x] Investigation store updated with event handlers
- [x] API routes for nodes and edges created
- [x] Collaborators hook and component created
- [x] Activity feed component created
- [x] Canvas component cleaned up
- [ ] Database migration (if needed)
- [ ] Environment variables configured (Supabase URL and keys)
- [ ] Test with multiple browsers/tabs

## Testing

### Local Testing

1. Open the app in two browser tabs
2. Load the same case in both
3. Make changes in one tab (add nodes, move positions, connect edges)
4. Verify changes appear instantly in the other tab
5. Refresh a tab and verify state is persisted

### Production Testing

1. Deploy to production
2. Have team members access the same case
3. Make changes and verify real-time sync
4. Verify data persistence across sessions

## Troubleshooting

### Changes not syncing?

- Check Supabase connection
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
- Check browser console for errors

### State not persisting?

- Verify database connection string
- Run `npx prisma migrate deploy` to ensure tables exist
- Check Prisma logs for database errors

### Collaborators not showing?

- Verify Supabase presence is enabled in channel config
- Check that `useCollaborators` hook is mounted
- Verify localStorage/session persistence settings

## Future Enhancements

1. **Version History**: Track all changes with ability to revert
2. **Conflict Resolution**: Handle simultaneous edits to the same node
3. **Change Notifications**: Alert investigators when nodes of interest are modified
4. **Audit Trail**: Complete history of who changed what and when
5. **Offline Support**: Queue changes when offline, sync when back online
6. **Graph Snapshots**: Save investigation states at key points
