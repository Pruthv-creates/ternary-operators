import { Mail } from "lucide-react";

interface ProfileHeaderProps {
    user: {
        name: string;
        email: string;
    };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <div className="p-6 border-b border-[#1e3a5f]/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-blue-500/20">
                    {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate leading-tight">{user.name}</h3>
                    <p className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1.5">
                        <Mail size={12} className="text-blue-400" />
                        {user.email}
                    </p>
                    <div className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                        Special Agent
                    </div>
                </div>
            </div>
        </div>
    );
}
