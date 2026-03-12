import { useState, useCallback } from "react";
import { Activity, MessageSquare, Zap, Trash2, LucideIcon } from "lucide-react";
import { SyncEvent } from "@/lib/realtimeSync";

export interface ActivityItemData {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    Icon: LucideIcon;
    iconColor: string;
}

export function useActivityFeed() {
    const [activities, setActivities] = useState<ActivityItemData[]>([]);

    const addActivity = useCallback((event: SyncEvent) => {
        const timestamp = new Date();
        let activityItem: ActivityItemData | null = null;

        const iconConfig = {
            create: { Icon: Zap, color: "text-emerald-500" },
            move: { Icon: Activity, color: "text-blue-500" },
            update: { Icon: MessageSquare, color: "text-purple-500" },
            delete: { Icon: Trash2, color: "text-red-500" },
        };

        const config = (type: string) => {
            if (type.includes("create")) return iconConfig.create;
            if (type.includes("move")) return iconConfig.move;
            if (type.includes("update")) return iconConfig.update;
            if (type.includes("delete")) return iconConfig.delete;
            return iconConfig.update;
        };

        const { Icon, color } = config(event.type);

        let message = "";
        let id = "";

        switch (event.type) {
            case "node-create":
                message = `Deployed ${event.node.type} node`;
                id = event.node.id;
                break;
            case "node-move":
                message = `Re-positioned asset`;
                id = event.id;
                break;
            case "node-update":
                message = `Modified intelligence`;
                id = event.id;
                break;
            case "node-delete":
                message = `Expunged nexus point`;
                id = event.id;
                break;
            case "edge-create":
                message = `Forged relation link`;
                id = event.edge.id;
                break;
            case "edge-delete":
                message = `Severed connection`;
                id = event.edgeId;
                break;
        }

        if (message) {
            activityItem = {
                id,
                type: event.type,
                message,
                timestamp,
                Icon,
                iconColor: color
            };
            setActivities((prev) => [activityItem!, ...prev].slice(0, 15));
        }
    }, []);

    return { activities, addActivity };
}
