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
        id: "saram",
        name: "Saram.",
        role: "",
        type: "person",
        avatar: "https://i.pravatar.cc/150?u=saram",
        riskScore: 20,
    },
];

export const timelineEvents: TimelineEvent[] = [
    {
        id: "e1",
        date: "Jul 2023",
        label: "AV APPOINTED CEO",
        description: "Appointed as CEO",
        type: "appointment",
    },
    {
        id: "e3",
        date: "Dec 2023",
        label: "SYNERGY IPO",
        description: "Goes public",
        type: "milestone",
    },
    {
        id: "e5",
        date: "Jul 2024",
        label: "SUSPICIOUS TRANSFER",
        description: "$12.5M transferred",
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
