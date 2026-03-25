<div align="center">
  <img src="https://img.shields.io/badge/Next.js-App_Router-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Flow-Graph_viz-FF0072?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Entity_Extraction-8B5CF6?style=for-the-badge&logo=openai&logoColor=white" />

  <h1>Epsilon3</h1>
  <p>A collaborative investigation & intelligence analysis platform for uncovering relationships between people, organizations, events, financial activities, and evidence sources.</p>
</div>

---

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Framework</strong><br />Next.js App Router</td>
      <td align="center"><strong>Graph</strong><br />React Flow</td>
      <td align="center"><strong>State</strong><br />Zustand</td>
      <td align="center"><strong>Database</strong><br />PostgreSQL</td>
    </tr>
  </table>
</div>

## Overview

**Epsilon3** is a collaborative **Investigation & Intelligence Analysis Platform** that replaces scattered tools like docs, spreadsheets, and chats with a **single investigation workspace**. It helps investigators analyze large amounts of data and surface hidden relationships between people, organizations, events, financial activities, and evidence.

## Features

- **Case Management:** Create and organize investigation cases in a structured workspace.
- **Evidence Collection:** Upload and tag documents, links, images, and notes with credibility scores.
- **AI Entity Extraction:** Automatically extract named entities (people, companies, banks, locations) from evidence.
- **Relationship Graph:** Interactive React Flow graph visualizing entity connections with drag, zoom, and pan.
- **Timeline Reconstruction:** Chronological mapping of events with evidence linking.
- **AI Investigation Insights:** Surface suspicious patterns, anomalies, and hidden or indirect relationships.
- **Hypothesis Creation:** Build and link investigative theories to evidence, entities, and events.
- **Team Collaboration:** Multi-user investigation workspace for collaborative analysis.

## Core Investigation Workflow

```
Create Case → Add Evidence → AI Extracts Entities → Relationship Graph Generated
     ↓
Timeline Reconstruction → AI Investigation Insights → Hypothesis Creation → Collaborative Investigation
```

## Main Routes

- `/dashboard` — main dashboard overview
- `/cases` — case list
- `/case/[id]` — individual case workspace

## Tech Stack

- Next.js `App Router`
- TypeScript `5.x`
- TailwindCSS
- shadcn/ui
- React Flow
- Framer Motion
- Lucide React
- Zustand
- PostgreSQL

## Requirements

- Node.js 18+
- npm
- PostgreSQL instance

## Run Locally

Install dependencies:

```bash
npm install reactflow zustand framer-motion lucide-react
```

Initialize the UI system:

```bash
npx shadcn-ui@latest init
```

Other useful commands:

```bash
npm run dev
npm run build
npm run start
```

## Database Schema

The platform uses five core tables:

| Table | Key Fields |
|---|---|
| `cases` | id, title, description, created_at |
| `evidence` | id, case_id, title, source, timestamp, credibility_score |
| `entities` | id, case_id, name, type (`person` / `company` / `bank` / `location`) |
| `relationships` | id, from_entity, to_entity, relationship_type, confidence |
| `timeline_events` | id, case_id, event_name, event_date |

## Project Structure

```text
app/
  dashboard/          Main dashboard view
  cases/              Case list
  case/[id]/          Individual case workspace

components/
  Sidebar.tsx         Navigation sidebar
  Topbar.tsx          Top action bar
  InvestigationCanvas.tsx   Central investigation workspace
  EntityGraph.tsx     React Flow graph component
  EvidenceCard.tsx    Evidence display cards
  Timeline.tsx        Chronological event timeline
  ContextPanel.tsx    Right-side entity detail panel
  AIAssistant.tsx     Chat-style AI assistant

lib/
  ai.ts               AI integration utilities
  graph.ts            Graph logic and data helpers
  timeline.ts         Timeline processing utilities

store/
  useCaseStore.ts     Zustand state management

types/
  case.ts / evidence.ts / entity.ts / relationship.ts
```

## User Flow

1. Investigator creates a new investigation case.
2. Evidence is uploaded — documents, links, images, or notes.
3. AI extracts named entities from the evidence automatically.
4. The relationship graph visualizes connections between entities.
5. Timeline reconstructs events in chronological order.
6. AI surfaces suspicious patterns, anomalies, and gaps.
7. Investigator builds hypotheses linked to evidence and entities.
8. Team collaborates on the investigation in real time.

## AI Capabilities

The AI layer powers four core features:

- **Entity extraction** — identify people, companies, banks, and locations from raw evidence text
- **Document summarization** — condense uploaded evidence into key findings
- **Relationship suggestions** — propose likely connections between extracted entities
- **Timeline event extraction** — infer dated events from unstructured content

## Future Enhancements

| Feature | Description |
|---|---|
| Cross-case entity detection | Flag entities appearing across multiple cases |
| OSINT data integration | Pull public data sources into the investigation |
| Financial anomaly detection | Automated pattern recognition on transactions |
| Document OCR | Extract text from scanned documents and images |
| Real-time collaboration | Live multi-user editing of the investigation canvas |
