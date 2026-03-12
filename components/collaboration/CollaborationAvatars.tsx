import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collaborator {
    userId?: string;
    id?: string;
    name: string;
    color?: string;
}

interface CollaborationAvatarsProps {
    collaborators: Collaborator[];
    limit?: number;
    size?: "sm" | "md";
}

export function CollaborationAvatars({ collaborators, limit = 5, size = "md" }: CollaborationAvatarsProps) {
    const list = collaborators.slice(0, limit);
    const hasMore = collaborators.length > limit;
    
    const sizeClasses = {
        sm: "h-6 w-6 text-[8px]",
        md: "h-8 w-8 text-[10px]",
    };

    if (collaborators.length === 0) {
        return (
            <div className={cn("rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600 transition-all", sizeClasses[size])}>
                <Users size={size === "sm" ? 12 : 14} />
            </div>
        );
    }

    return (
        <div className="flex -space-x-2">
            {list.map((user, i) => (
                <div
                    key={user.userId || user.id || i}
                    title={user.name}
                    className={cn(
                        "rounded-full ring-2 ring-[#0a0f1c] bg-[#1e293b] flex items-center justify-center font-bold text-white border transition-all hover:scale-110 hover:z-10",
                        sizeClasses[size]
                    )}
                    style={{ 
                        borderColor: user.color || "#3b82f6",
                        backgroundColor: user.color ? `${user.color}20` : undefined,
                        color: user.color || "#3b82f6" 
                    }}
                >
                    {user.name.charAt(0).toUpperCase()}
                </div>
            ))}
            {hasMore && (
                <div className={cn("rounded-full ring-2 ring-[#0a0f1c] bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 z-10", sizeClasses[size])}>
                    +{collaborators.length - limit}
                </div>
            )}
        </div>
    );
}
