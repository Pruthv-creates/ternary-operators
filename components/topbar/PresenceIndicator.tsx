import { PresenceUser } from "@/hooks/useTopbarPresence";

interface PresenceIndicatorProps {
    presenceUsers: PresenceUser[];
}

export function PresenceIndicator({ presenceUsers }: PresenceIndicatorProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] border border-[#1e3a5f]/60 rounded-lg shrink-0">
            <div className="relative flex -space-x-1.5">
                {presenceUsers.length > 0 ? (
                    presenceUsers.map((u, i) => (
                        <div
                            key={`${u.initials}-${i}`}
                            title={u.name}
                            className={`w-5 h-5 rounded-full ${u.color} flex items-center justify-center text-[8px] font-bold text-white border border-[#0d1424]`}
                        >
                            {u.initials}
                        </div>
                    ))
                ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white border border-[#0d1424]">
                        ?
                    </div>
                )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                {presenceUsers.length > 1 ? `${presenceUsers.length} Investigators` : "Active"}
            </span>
        </div>
    );
}
