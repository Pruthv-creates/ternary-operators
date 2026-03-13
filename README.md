# Epsilon3 – Investigation Intelligence Platform

> A collaborative investigation & intelligence analysis platform for uncovering relationships between people, organizations, events, financial activities, and evidence sources.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Investigation Workflow](#2-core-investigation-workflow)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Database Design](#5-database-design)
6. [Development Workflow](#6-development-workflow)
7. [Final User Journey](#7-final-user-journey)
8. [Future Enhancements](#8-future-enhancements)
9. [Expected Outcome](#9-expected-outcome)

---

## 1. Project Overview

**Epsilon3** is a collaborative **Investigation & Intelligence Analysis Platform** that helps investigators analyze large amounts of data and uncover relationships between:

- People
- Organizations
- Events
- Financial activities
- Evidence sources

Instead of using scattered tools like docs, spreadsheets, and chats, Epsilon3 provides a **single investigation workspace**.

### Core Capabilities

| Feature | Description |
|---|---|
| Case Management | Create and organize investigation cases |
| Evidence Collection | Upload and tag documents, links, images, notes |
| Entity Extraction | AI-powered extraction of key entities from evidence |
| Relationship Graph | Visual graph of entity connections via React Flow |
| Timeline Reconstruction | Chronological event mapping |
| AI Investigation Insights | Detect patterns, anomalies, and hidden relationships |
| Hypothesis Creation | Build and link investigative theories |
| Team Collaboration | Multi-user investigation workspace |

---

## 2. Core Investigation Workflow

```
Create Case
   ↓
Add Evidence
   ↓
AI Extracts Entities
   ↓
Relationship Graph Generated
   ↓
Timeline Reconstruction
   ↓
AI Investigation Insights
   ↓
Hypothesis Creation
   ↓
Collaborative Investigation
```

---

## 3. Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js | App framework (App Router) |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| shadcn/ui | UI component library |
| React Flow | Graph/network visualization |
| Framer Motion | Animations |
| Lucide React | Icons |

### Backend

- Next.js API routes
- Node.js

### Database

- PostgreSQL

### AI Layer

AI features include:
- Entity extraction
- Document summarization
- Relationship suggestions
- Timeline event extraction

---

## 4. Folder Structure

```
/app
   /dashboard          → Main dashboard view
   /cases              → Case list
   /case/[id]          → Individual case workspace

/components
   Sidebar.tsx          → Navigation sidebar
   Topbar.tsx           → Top action bar
   InvestigationCanvas.tsx  → Central investigation workspace
   EntityGraph.tsx      → React Flow graph component
   EvidenceCard.tsx     → Evidence display cards
   Timeline.tsx         → Chronological event timeline
   ContextPanel.tsx     → Right-side entity detail panel
   AIAssistant.tsx      → Chat-style AI assistant

/lib
   ai.ts               → AI integration utilities
   graph.ts            → Graph logic and data helpers
   timeline.ts         → Timeline processing utilities

/store
   useCaseStore.ts     → Zustand state management

/types
   case.ts             → Case type definitions
   evidence.ts         → Evidence type definitions
   entity.ts           → Entity type definitions
   relationship.ts     → Relationship type definitions
```

---

## 5. Database Design

### Cases Table

| Field | Type |
|---|---|
| id | uuid |
| title | text |
| description | text |
| created_at | timestamp |

### Evidence Table

| Field | Type |
|---|---|
| id | uuid |
| case_id | uuid |
| title | text |
| description | text |
| source | text |
| timestamp | timestamp |
| credibility_score | number |

### Entities Table

| Field | Type |
|---|---|
| id | uuid |
| case_id | uuid |
| name | text |
| type | `person` / `company` / `bank` / `location` |

### Relationships Table

| Field | Type |
|---|---|
| id | uuid |
| from_entity | uuid |
| to_entity | uuid |
| relationship_type | text |
| confidence | number |

### Timeline Events Table

| Field | Type |
|---|---|
| id | uuid |
| case_id | uuid |
| event_name | text |
| event_date | date |

---

## 6. Development Workflow

### Step 1 — Initialize Project

```bash
npx create-next-app@latest epsilon3
cd epsilon3
```

Install core libraries:

```bash
npm install reactflow zustand framer-motion lucide-react
```

Install UI system:

```bash
npx shadcn-ui@latest init
```

---

### Step 2 — Build Application Layout

Create the base interface with this layout structure:

```
Sidebar | Investigation Canvas | Context Panel
```

Components to build:
- `Sidebar` — navigation and case list
- `Topbar` — actions and status
- Main canvas — central investigation area
- Right context panel — entity details

---

### Step 3 — Case Management

Users should be able to:
- Create new cases
- View the case list
- Open a case workspace

Example case:
```
CASE-1049
Project Chimera – Financial Fraud
```

---

### Step 4 — Evidence Management

Users add evidence to a case. Supported evidence types:
- Documents
- Links
- Images
- Notes

Evidence metadata:
- Title, description, source
- Timestamp
- Credibility score (0–100)

Evidence renders as **cards** in the canvas. Example evidence cards:
```
Financial Records Q4
Confidential Email
Travel Logs
Offshore Leak Link
```

---

### Step 5 — AI Entity Extraction

When evidence is added, AI extracts named entities from the text:

```
Alexander Volkov  →  Person
Synergy Corp      →  Company
Alpha Bank        →  Bank
London Office     →  Location
```

Entities are stored in the database and state.

---

### Step 6 — Relationship Graph

Built with **React Flow**. Nodes represent entities; edges represent relationships.

Example relationships:
```
Volkov       → Owner        → Synergy Corp
Synergy Corp → Bank Account → Alpha Bank
Synergy Corp → Location     → London Office
```

Graph must support:
- Drag nodes
- Zoom & pan
- Click to select a node
- Highlight connected edges

---

### Step 7 — Investigation Canvas

The **central workspace** where investigators analyze data.

Canvas displays:
- Relationship graph
- Evidence cards
- Hypothesis notes

Investigators visually connect findings across all three layers.

---

### Step 8 — Timeline Reconstruction

Timeline shows events in chronological order:

```
Jan 2023  – Volkov appointed CEO
Dec 2023  – Synergy IPO
Jul 2024  – Suspicious transfer detected
```

Users can:
- Add timeline events manually
- Link evidence items to specific events

---

### Step 9 — AI Insights

AI analyzes the full investigation state and surfaces:
- Suspicious entities
- Abnormal financial activity
- Timeline gaps
- Hidden or indirect relationships

Example AI output:
```
⚠  Synergy Corp connected to offshore entity
⚠  Possible money laundering pattern detected
```

---

### Step 10 — Hypothesis Creation

Investigators create and document theories:

```
Shell company used for laundering?
```

Hypotheses can be linked to:
- Evidence cards
- Entities
- Timeline events

---

### Step 11 — Context Panel

The right-side panel shows full details of the selected entity.

Content includes:
- Entity profile (name, type, attributes)
- Linked evidence
- Related entities
- Relevant timeline events
- AI-generated insights

Panel updates dynamically when a new entity is selected on the graph.

---

### Step 12 — AI Investigation Assistant

A chat-style assistant embedded in the workspace.

Capabilities:
- Summarize the current investigation state
- Suggest next analysis steps
- Detect suspicious patterns across all evidence

Example suggestions:
```
Explore Volkov's financial ties to offshore accounts
Analyze Synergy Corp internal communications
Detect missing events in the 2023 timeline
```

---

## 7. Final User Journey

```
Investigator logs in
      ↓
Creates investigation case
      ↓
Uploads evidence (documents, links, images, notes)
      ↓
AI extracts entities from evidence
      ↓
Relationship graph visualizes entity connections
      ↓
Timeline reconstructs chronological events
      ↓
AI highlights suspicious patterns and anomalies
      ↓
Investigator builds hypotheses linked to evidence
      ↓
Team collaborates on the investigation in real time
```

---

## 8. Future Enhancements

| Feature | Description |
|---|---|
| Cross-case entity detection | Flag entities appearing in multiple cases |
| OSINT data integration | Pull public data into the investigation |
| Financial anomaly detection | Automated pattern recognition on transactions |
| Document OCR | Extract text from scanned documents and images |
| Real-time collaboration | Live multi-user editing of the investigation canvas |

---

## 9. Expected Outcome

The final system should demonstrate:

- ✅ A structured, single-workspace investigation environment
- ✅ Interactive relationship graph visualization
- ✅ AI-assisted intelligence analysis and pattern detection
- ✅ A collaborative investigation workflow for teams
