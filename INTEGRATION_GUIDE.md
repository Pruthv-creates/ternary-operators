# Quick Integration Guide - Real-Time Collaboration

## For UI Developers

### Adding Collaborators Indicator to Your Layout

```tsx
import { CollaboratorsIndicator } from "@/components/CollaboratorsIndicator";
import { useInvestigationStore } from "@/store/investigationStore";

export function MyLayout() {
  const { currentCaseId } = useInvestigationStore();

  return (
    <div>
      <div className="p-4 border-b">
        <CollaboratorsIndicator caseId={currentCaseId} />
      </div>
      {/* Rest of layout */}
    </div>
  );
}
```

### Adding Activity Feed to Sidebar

```tsx
import { ActivityFeed } from "@/components/ActivityFeed";

export function Sidebar() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <ActivityFeed />
    </div>
  );
}
```

### Handling Sync Events in Custom Components

```tsx
import { useInvestigationStore } from "@/store/investigationStore";
import { SyncEvent } from "@/lib/realtimeSync";

export function MyCustomComponent() {
  const { handleRemoteEvent } = useInvestigationStore();

  function onSyncEvent(event: SyncEvent) {
    handleRemoteEvent(event);
  }

  return <ActivityFeed onEvent={onSyncEvent} />;
}
```

## For Backend Developers

### Broadcasting Custom Events

If you need to manually broadcast an event:

```typescript
import { realtimeSyncManager } from "@/lib/realtimeSync";

export async function customAction() {
  // Do some work...

  // Broadcast it
  await realtimeSyncManager.broadcast({
    type: "node-create",
    node: newNode,
  });
}
```

### Understanding the Sync Events

All sync events follow this pattern:

```typescript
type SyncEvent =
  | { type: "node-move"; id: string; position: { x: number; y: number } }
  | { type: "node-create"; node: Node }
  | { type: "node-update"; id: string; data: Record<string, unknown> }
  | { type: "node-delete"; id: string }
  | { type: "edge-create"; edge: Edge }
  | { type: "edge-delete"; edgeId: string }
  | { type: "graph-full-update"; nodes: Node[]; edges: Edge[] };
```

### Database Schema

Nodes and Edges are automatically persisted:

```prisma
model Node {
  id String @id
  caseId String
  positionX Float
  positionY Float
  label String
  content String? // JSON data
  updatedAt DateTime @updatedAt
}

model Edge {
  id String @id
  caseId String
  sourceId String
  targetId String
  relationshipType String
  createdAt DateTime
}
```

## Common Patterns

### Pattern 1: Listening to Specific Users' Changes

```typescript
import { useCollaborators } from "@/hooks/useCollaborators";

export function CollaboratorChanges({ caseId }: { caseId: string }) {
  const { collaborators } = useCollaborators(caseId);

  return (
    <div>
      <p>{collaborators.length} investigators online</p>
      {collaborators.map(collab => (
        <div key={collab.id}>{collab.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Optimistic UI Updates

```typescript
const store = useInvestigationStore();

// Action happens locally first
store.updateNodeData(nodeId, newData);

// Then persists asynchronously
// If it fails, you can revert with:
store.loadCaseData(caseId); // Reload from DB
```

### Pattern 3: Activity Timeline

```tsx
import { ActivityFeed } from "@/components/ActivityFeed";

export function CaseTimeline() {
  return (
    <div className="border-l-2 border-blue-500 pl-4">
      <h2 className="text-lg font-bold mb-4">Timeline</h2>
      <ActivityFeed />
    </div>
  );
}
```

## Testing Real-Time Features

### Test 1: Multi-Tab Collaboration

1. Open case in Tab A and Tab B
2. In Tab A: `store.addNode(newNode)`
3. In Tab B: Verify node appears instantly

### Test 2: Persistence

1. Load case in Tab A
2. Make changes
3. Close Tab A and browser
4. Open case again
5. Verify all changes are still there

### Test 3: Presence

1. Open case in Tab A
2. Open case in Tab B
3. In Tab A: `CollaboratorsIndicator` shows 2 people
4. Close Tab B
5. In Tab A: `CollaboratorsIndicator` shows 1 person

## Debugging

### Enable Debugging Logs

```typescript
// In a component
import { realtimeSyncManager } from "@/lib/realtimeSync";

// Subscribe with logging
await realtimeSyncManager.subscribe(caseId, (event) => {
  console.log("[SYNC EVENT]", event);
  store.handleRemoteEvent(event);
});
```

### Check Supabase Connection

```typescript
import { supabase } from "@/lib/supabase";

supabase.auth.getSession().then(({ data }) => {
  console.log("Supabase connected:", !!data.session);
});
```

### Verify Database Saves

```sql
-- Query Postgres directly
SELECT * FROM "Node" WHERE "caseId" = 'case-123' ORDER BY "updatedAt" DESC;
SELECT * FROM "Edge" WHERE "caseId" = 'case-123';
```

## Performance Tips

1. **Avoid Rapid Events**: Throttle position updates:

```typescript
const throttledMove = throttle((id, pos) => {
  realtimeSyncManager.broadcast({ type: "node-move", id, position: pos });
}, 100);
```

2. **Batch Updates**: Group multiple changes:

```typescript
store.updateNodeData(id1, data1);
store.updateNodeData(id2, data2);
store.updateNodeData(id3, data3);
// All broadcast separately - consider batching
```

3. **Clean Up Subscriptions**: Done automatically, but ensure:

```typescript
useEffect(() => {
  return () => {
    realtimeSyncManager.unsubscribe();
  };
}, []);
```

## Next Steps

1. Add `<CollaboratorsIndicator />` to your layout
2. Add `<ActivityFeed />` to a sidebar or panel
3. Test multi-tab/multi-user workflow
4. Monitor performance with real data
5. Consider adding notification when collaborators make changes

## Support

If you encounter issues:

1. Check `COLLABORATION.md` for detailed architecture
2. Check `IMPLEMENTATION_SUMMARY.md` for what was changed
3. Review console logs for sync events
4. Verify Supabase is connected
5. Check database migrations ran successfully

Happy collaborating! 🚀
