Brutal Codebase Audit — Nexus/Astra Investigation Platform
Overall Verdict: 6/10 — Impressively ambitious, structurally shaky
The app has great vibes and real ambition — real-time collab, WebRTC voice, RAG pipeline, conflict resolution, knowledge graph canvas. That's genuinely impressive scope. But underneath the polished UI skin, there are some real problems.

🔴 Critical / Broken
1. The Canvas is detached from the case system on first load

app/page.tsx
 (the main canvas route /) renders with just initialNodes = [{ id: "volkov", ... }] hardcoded in the store. It only loads real case data if someone navigated from the Cases page (via 

loadCaseData
). If someone opens / fresh, they get a phantom "Alexander Volkov" node that belongs to no case — all saves will silently fail because currentCaseId is null. There's no guard.

2. 

addNode
 silently does nothing without a case loaded
typescript
addNode: async (node: Node) => {
    const caseId = get().currentCaseId;
    if (!caseId) return; // 🔕 completely silent
User clicks "Add Entity", sees it appear on screen, then it doesn't get persisted anywhere. No error. No warning to the user. The node just... vanishes on refresh.

3. 

main.py
 has a broken function call
In /generate-relation, line 103:

python
connection_info, _ = query_rag(connection_query)  # ❌ missing case_id argument

query_rag
 requires 2 arguments (question, case_id). This endpoint will crash with a TypeError every single time it's called.

4. The 

/api/ai/route.ts
 doesn't forward caseId
The evidence page sends { question, caseId } via POST. The Next.js proxy route only destructures question and forwards it to the Python backend — caseId is completely dropped. So the RAG query always fails to scope to the right case.

5. Timeline page is basically a demo screen
The timeline heatmap is entirely fake — 12 hardcoded month columns, two hardcoded blob divs. The "Temporal Density" visual doesn't actually render events. The "Commit Events" button does absolutely nothing. "New Manual Entry" button does nothing. The whole left panel is purely decorative.

6. Entities page is entirely mocked — 100%
javascript
const pendingEntities = [
    { id: 1, name: "Synergy Corp", ... },  // hardcoded
    ...
]
"Entity Stage (12)" says 12 entities in the header but there are 4 hardcoded ones. "Promote to Canvas" — does nothing. "Execute AI Merge" — does nothing. "Accept version" buttons — do nothing. The checklist items are hardcoded booleans. Zero functionality.

7. Intelligence page (/intelligence) does nothing
The "Ask Astra AI" input has no handler — the Send button has no onClick, the form has no onSubmit. The "Suggested Actions" buttons animate but do nothing. It's pure decoration pretending to be an AI chat.

🟡 Wacky / Concerning
8. TURN server credentials hardcoded in source
typescript
{ urls: "turn:standard.relay.metered.ca:443",
  username: "e2a44b0e2a6e8dd4e30a5bbd",
  credential: "yFvlO9N6z1w5BXJH" }
Real TURN credentials sitting in 

VoiceComms.tsx
, committed to the repo. Anyone can scrape these and use your TURN quota.

9. alert() calls in production UI
typescript
onClick={() => alert("ASTRA Intelligence Portal\nAnalyst: DHARYAJ4N1...")}
The "Agent" button in the canvas literally pops a browser alert. With hardcoded fake credentials DHARYAJ4N1. This is a debug stub that never got removed.

10. "Purge Index" button in Evidence page just clears local state
tsx
onClick={() => setFiles([])}
It doesn't call any API, doesn't touch the Python backend, doesn't delete anything from the vector store. The files are still indexed — the UI just lies and shows an empty list.

11. AuthGate shows "Agent Name" field on the login form
The login view (view === "login") shows the "Agent Name" field even though it's only needed for signup. The required attribute is correctly conditional, but the field still renders and confuses users on the login screen.

12. Error handling = alert(error.message) everywhere in auth
typescript
if (error) alert(error.message);
Raw Supabase errors (e.g., "Invalid login credentials") are dumped directly to browser alert(). No styled error UI.

13. <style jsx global> usage in 3 pages

timeline/page.tsx
, 

evidence/page.tsx
, and 

entities/page.tsx
 all use <style jsx global>, which is a styled-jsx pattern. This project doesn't have styled-jsx installed — it uses Tailwind. This works coincidentally in some contexts but is wrong and will break in strict Next.js configs.

14. 

rag_engine.py
 calls .persist() on Chroma which was deprecated
python
vectordb.persist()
This was removed in recent Chroma versions. The backend likely throws a warning or silently fails to persist depending on the installed version.

15. VoiceComms.tsx is 1,124 lines
This file is genuinely massive and mixes WebRTC signaling logic, Web Audio EQ chains, ICE candidate management, and UI all in a single component. If it breaks, it's a nightmare to debug.

16. 

investigationStore.ts
 calls 

set()
 inside 

onNodesChange
 twice in sequence
ts
set({ nodes: updatedNodes }); // first set
// ...later in the same change handler...
set({ nodes: get().nodes.map(...) }); // second set, overwrites the first
This creates a race where the position update from applyNodeChanges can be stomped by the version-bump set that runs immediately after, depending on React's batching behavior.

🟠 Unfinished / Incomplete Features
Feature	Status
Entities Page	0% functional — all mock data
Timeline Heatmap Visualization	Fake static HTML
"Commit Events" button	Dead button
"New Manual Entry" button	Dead button
Intelligence Page chat	Input has no handler
"Promote to Canvas" on entities	Dead button
"Execute AI Merge"	Dead button
"Accept version" conflict buttons	Dead button
Evidence "Purge Index"	Fake — only clears local state
Collaboration Page	Has unused offer variable (lint error)
graph/InvestigationGraph.tsx	Has a setNodes assigned but never used
Filter dropdown on timeline	Visual only, no functionality
Filter dropdown on entities	Visual only, no functionality
🟢 What Actually Works Well
Cases page — genuinely functional: loads real data from DB, runs AI analysis, saves to DB, persists analysis across sessions
Evidence upload & RAG query — mostly functional (aside from the caseId proxy bug)
Real-time collaboration (cursors + node sync) — well-architected with versioning/nonces and tombstoning
VoiceComms — the WebRTC implementation is actually solid with proper perfect-negotiation pattern, ICE queuing, and audio processing chain
Investigation Canvas — ReactFlow integration works, filters work, search works
AuthGate — correct OTP flow, session persistence works
AI Analysis on Cases page — full round trip works (LLM → score → persist → display)
📊 Summary
Pages with meaningful functionality: 3/7  (canvas, cases, evidence)
Pages that are mostly/entirely fake:  4/7  (entities, intelligence, timeline, collaboration)
Backend endpoints that crash:          1   (/generate-relation)
Critical data loss bugs:               2   (no-case-id silent drop, addNode)
Hardcoded secrets in source:           1   (TURN credentials)
alert() calls in prod UI:              2
Lint errors (real errors, not warnings): ~35+
The bones are solid — backend AI pipeline is real, realtime sync is real, the canvas is real. But almost half the UI is elaborate theater. For a hackathon context that's understandable, but don't demo the Entities or Intelligence pages without protecting those routes first.