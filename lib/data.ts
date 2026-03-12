export type EntityType = "person" | "company" | "bank" | "location" | "offshore";

export interface Entity {
    id: string;
    name: string;
    role: string;
    type: EntityType;
    status?: "Active" | "Abnormal" | "Flagged" | "Inactive";
    avatar?: string;
    // other placeholder fields
    industry?: string;
    location?: string;
    riskScore?: number;
    credibilityScore?: number;
    aiInsights?: string[];
    links?: string[];
    timelineEvents?: string[];
}

export interface TimelineEvent {
    id: string;
    date: string;
    label: string;
    description: string;
    type: "milestone" | "alert" | "transfer" | "appointment";
}

export interface EvidenceItem {
    id: string;
    title: string;
    credibility: number;
    timestamp: string;
    type: "financial" | "communication" | "travel";
    nodeId: string;
}

export interface AIAction {
    id: string;
    text: string;
    icon: "search" | "alert" | "chart";
    priority: "high" | "medium" | "low";
}

export const entities: Entity[] = [
    {
        id: "volkov",
        name: "Alexander Volkov",
        role: "CEO",
        type: "person",
        avatar: "https://i.pravatar.cc/150?u=volkov",
        riskScore: 87,
    },
    {
        id: "synergy",
        name: "Synergy Corp",
        role: "Company",
        type: "company",
        riskScore: 74,
    },
    {
        id: "alpha-bank",
        name: "Alpha Bank",
        role: "Bank Account",
        type: "bank",
        riskScore: 91,
    },
    {
        id: "offshore",
        name: "Offshore Entity",
        role: "Seychelles",
        type: "offshore",
        riskScore: 95,
    },
    {
        id: "london",
        name: "Location: London Office",
        role: "",
        type: "location",
        riskScore: 32,
    },
    {
        id: "rashid",
        name: "Ahmad Rashid",
        role: "Shareholder",
        type: "person",
        avatar: "https://i.pravatar.cc/150?u=rashid",
        riskScore: 54,
    },
    {
        id: "petrova",
        name: "Elena Petrova",
        role: "Shareholder",
        type: "person",
        avatar: "https://i.pravatar.cc/150?u=petrova",
        riskScore: 48,
    },
    {
        id: "architect",
        name: "The Architect",
        role: "Financial Mastermind",
        type: "person",
        status: "Abnormal",
        riskScore: 98,
        credibilityScore: 40,
    },
    {
        id: "the-lua",
        name: "THE LUA (Yacht)",
        role: "Meeting Venue",
        type: "location",
        status: "Flagged",
        riskScore: 85,
    },
];

export const timelineEvents: TimelineEvent[] = [
    {
        id: "e1",
        date: "Dec 13, 2023",
        label: "VOLKOV TRAVEL: LONDON TO NICOSIA",
        description: "Subject Volkov detected on flight LHR-LCA 48h before major transfer.",
        type: "appointment",
    },
    {
        id: "e2",
        date: "Dec 15, 2023",
        label: "CRITICAL TRANSFER: $12.5M",
        description: "SWIFT transfer Synergy Corp -> Alpha Bank. Flagged for layering.",
        type: "alert",
    },
    {
        id: "e3",
        date: "Jan 05, 2024",
        label: "ORION HOLDINGS INJECTION",
        description: "$4.2M moved to Orion shell company for Nicosia operations.",
        type: "milestone",
    },
    {
        id: "e4",
        date: "Jan 08, 2024",
        label: "BLUEWAVE ADVISORY FEE",
        description: "$1.5M paid to BlueWave Corp. Suspected 'kickback' for legal shielding.",
        type: "milestone",
    },
    {
        id: "e5",
        date: "Feb 10, 2024",
        label: "NEXUS SETTLEMENT",
        description: "$12.5M clearing through Orion Holdings prior to Panama exit.",
        type: "alert",
    },
    {
        id: "e6",
        date: "Feb 15, 2024",
        label: "LIMASSOL SUMMIT: 'THE LUA'",
        description: "Physical meeting Volkov/Mercer/Ahmad on private yacht. Documents exchanged.",
        type: "alert",
    },
];

export const evidenceItems: EvidenceItem[] = [
    {
        id: "ev1",
        title: "FINANCIAL RECORDS Q4",
        credibility: 98,
        timestamp: "7 months ago",
        type: "financial",
        nodeId: "volkov",
    },
    {
        id: "ev2",
        title: "CONFIDENTIAL EMAIL (AV to EP)",
        credibility: 85,
        timestamp: "7 minutes ago",
        type: "communication",
        nodeId: "petrova",
    },
    {
        id: "ev3",
        title: "TRAVEL LOGS (AV)",
        credibility: 91,
        timestamp: "3 days ago",
        type: "travel",
        nodeId: "alpha-bank",
    },
];

export const aiActions: AIAction[] = [
    { id: "a1", text: "Explore Volkov's financial ties in Cyprus", icon: "search", priority: "high" },
    { id: "a2", text: "Missing timeline event for July 12", icon: "alert", priority: "medium" },
    { id: "a3", text: "Analyze Synergy Corp communication logs", icon: "chart", priority: "low" },
    { id: "a4", text: "Map offshore entity beneficial owners", icon: "search", priority: "high" },
];
