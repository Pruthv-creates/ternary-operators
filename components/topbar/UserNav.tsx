interface UserNavProps {
    userEmail: string;
    avatar?: string;
    onClick: () => void;
}

export function UserNav({ userEmail, avatar, onClick }: UserNavProps) {
    return (
        <div
            className="flex items-center gap-2.5 pl-3 border-l border-[#1e3a5f]/50 cursor-pointer group shrink-0"
            onClick={onClick}
        >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase group-hover:ring-2 ring-blue-500/50 transition-all shrink-0 overflow-hidden">
                {avatar ? (
                    <img src={avatar} alt={userEmail} className="w-full h-full object-cover" />
                ) : (
                    userEmail[0]
                )}
            </div>
            <div className="hidden sm:flex flex-col leading-none gap-0.5">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide max-w-[96px] truncate">{userEmail}</span>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Profile</span>
            </div>
        </div>
    );
}
