import { useState, useRef } from "react";
import { Activity, MessageSquare, Zap, Trash2 } from "lucide-react";
import { SyncEvent } from "@/lib/realtimeSync";

interface ActivityItem {
  id: string;
  type: "node-create" | "node-move" | "node-update" | "node-delete" | "edge-create" | "edge-delete";
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
}

interface ActivityFeedProps {
  onEvent?: (event: SyncEvent) => void;
}

export const ActivityFeed = ({ onEvent }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const handleIncomingEventRef = useRef<(event: SyncEvent) => void>();

  handleIncomingEventRef.current = (event: SyncEvent) => {
    const timestamp = new Date();
    let activityItem: ActivityItem | null = null;

    switch (event.type) {
      case "node-create":
        activityItem = {
          id: event.node.id,
          type: "node-create",
          message: `Created ${event.node.type} node`,
          timestamp,
          icon: <Zap size={14} className="text-green-600" />,
        };
        break;

      case "node-move":
        activityItem = {
          id: event.id,
          type: "node-move",
          message: `Moved node`,
          timestamp,
          icon: <Activity size={14} className="text-blue-600" />,
        };
        break;

      case "node-update":
        activityItem = {
          id: event.id,
          type: "node-update",
          message: `Updated node`,
          timestamp,
          icon: <MessageSquare size={14} className="text-purple-600" />,
        };
        break;

      case "node-delete":
        activityItem = {
          id: event.id,
          type: "node-delete",
          message: `Deleted node`,
          timestamp,
          icon: <Trash2 size={14} className="text-red-600" />,
        };
        break;

      case "edge-create":
        activityItem = {
          id: event.edge.id,
          type: "edge-create",
          message: `Created edge connection`,
          timestamp,
          icon: <Zap size={14} className="text-green-600" />,
        };
        break;

      case "edge-delete":
        activityItem = {
          id: event.edgeId,
          type: "edge-delete",
          message: `Deleted edge connection`,
          timestamp,
          icon: <Trash2 size={14} className="text-red-600" />,
        };
        break;
    }

    if (activityItem) {
      setActivities((prev) => [activityItem!, ...prev].slice(0, 10)); // Keep last 10 activities
    }

    onEvent?.(event);
  };

  return (
    <div className="space-y-2">
      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No recent activity</p>
      ) : (
        activities.map((activity) => (
          <div
            key={`${activity.id}-${activity.timestamp.getTime()}`}
            className="flex items-center gap-2 text-xs py-2 px-2 bg-gray-50 rounded hover:bg-gray-100 transition"
          >
            {activity.icon}
            <span className="flex-1 text-gray-700">{activity.message}</span>
            <span className="text-gray-500">
              {activity.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
