"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Building2,
    User,
    Landmark,
    Globe,
    MapPin,
    Activity,
    Clock,
    ExternalLink,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { Entity, EntityType } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useInvestigationStore } from "@/store/investigationStore";

interface ContextPanelProps {
    entity: Entity | null;
    onClose: () => void;
}

const typeIcons: Record<EntityType, React.ReactNode> = {
    person: <User size={28} strokeWidth={1.2} />,
    company: <Building2 size={28} strokeWidth={1.2} />,
    bank: <Landmark size={28} strokeWidth={1.2} />,
    location: <MapPin size={28} strokeWidth={1.2} />,
    offshore: <Globe size={28} strokeWidth={1.2} />,
};

const typeColors: Record<EntityType, string> = {
    person: "from-blue-500/20 to-blue-700/10 border-blue-500/30 text-blue-400",
    company: "from-purple-500/20 to-purple-700/10 border-purple-500/30 text-purple-400",
    bank: "from-emerald-500/20 to-emerald-700/10 border-emerald-500/30 text-emerald-400",
    location: "from-amber-500/20 to-amber-700/10 border-amber-500/30 text-amber-400",
    offshore: "from-rose-500/20 to-rose-700/10 border-rose-500/30 text-rose-400",
};

const statusColors: Record<string, string> = {
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Abnormal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Flagged: "bg-red-500/10 text-red-400 border-red-500/20",
    Inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function ContextPanel({ entity, onClose }: ContextPanelProps) {
    const [showAllInsights, setShowAllInsights] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { updateNodeData } = useInvestigationStore();

    const [editedEntity, setEditedEntity] = useState<Entity | null>(null);

    useEffect(() => {
        if (entity) {
            setEditedEntity({ ...entity });
        } else {
            setEditedEntity(null);
        }
        setIsEditing(false);
    }, [entity]);

    const handleEdit = () => {
        setEditedEntity({ ...entity! });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editedEntity) {
            updateNodeData(editedEntity.id, {
                name: editedEntity.name,
                role: editedEntity.role,
                type: editedEntity.type,
                avatar: editedEntity.avatar,
                status: editedEntity.status,
                industry: editedEntity.industry,
                location: editedEntity.location,
                riskScore: editedEntity.riskScore,
                credibilityScore: editedEntity.credibilityScore,
            });
            setIsEditing(false);
        }
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedEntity(prev => prev ? { ...prev, avatar: reader.result as string } : null);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AnimatePresence>
            {entity && (
                <motion.div
                    key={entity.id}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-80 min-w-[320px] h-full bg-[#0d1424] border-l border-[#1e3a5f]/50 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]/50">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Dynamic Context</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={isEditing ? handleSave : handleEdit}
                                className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                            >
                                {isEditing ? "Save" : "Edit"}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Entity Profile */}
                        <div className="p-4 border-b border-[#1e3a5f]/50">
                            <div className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Entity Profile</div>

                            {/* Entity avatar + name */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="relative group">
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-gradient-to-br transition-all",
                                            typeColors[entity.type]
                                        )}
                                    >
                                        {(isEditing ? editedEntity?.avatar : entity.avatar) ? (
                                            <img src={isEditing ? editedEntity?.avatar : entity.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
                                        ) : (
                                            typeIcons[entity.type]
                                        )}
                                    </div>
                                    {isEditing && (
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black text-white text-center px-1 uppercase leading-tight">Change Pic</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePictureChange} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <div className="space-y-1">
                                            <input 
                                                value={editedEntity?.name || ""} 
                                                onChange={e => setEditedEntity(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                className="w-full bg-[#0a0f1c] border border-blue-500/30 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-blue-500"
                                            />
                                            <input 
                                                value={editedEntity?.role || ""} 
                                                onChange={e => setEditedEntity(prev => prev ? { ...prev, role: e.target.value } : null)}
                                                className="w-full bg-[#0a0f1c] border border-blue-500/30 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none"
                                            />
                                            <select 
                                                value={editedEntity?.status || ""} 
                                                onChange={e => setEditedEntity(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                                                className="w-full bg-[#0a0f1c] border border-blue-500/30 rounded px-1 py-0.5 text-[9px] text-slate-300 outline-none"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Abnormal">Abnormal</option>
                                                <option value="Flagged">Flagged</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm font-bold text-white uppercase tracking-wide leading-tight truncate">
                                                {entity.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase mt-0.5">{entity.role}</div>
                                            {entity.status && (
                                                <span className={cn("inline-block mt-1.5 px-2 py-0.5 text-[9px] font-semibold border rounded uppercase tracking-wide", statusColors[entity.status])}>
                                                    {entity.status}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                                <div className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Details</div>
                                
                                <div className="flex justify-between items-center h-6">
                                    <span className="text-[10px] text-slate-500">Industry:</span>
                                    {isEditing ? (
                                        <input 
                                            value={editedEntity?.industry || ""} 
                                            onChange={e => setEditedEntity(prev => prev ? { ...prev, industry: e.target.value } : null)}
                                            className="bg-[#0a0f1c] border border-blue-500/30 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none text-right w-1/2"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-medium text-right max-w-[120px] truncate">{entity.industry || "N/A"}</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center h-6">
                                    <span className="text-[10px] text-slate-500">Location:</span>
                                    {isEditing ? (
                                        <input 
                                            value={editedEntity?.location || ""} 
                                            onChange={e => setEditedEntity(prev => prev ? { ...prev, location: e.target.value } : null)}
                                            className="bg-[#0a0f1c] border border-blue-500/30 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none text-right w-1/2"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-medium">{entity.location || "Unknown"}</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center h-6">
                                    <span className="text-[10px] text-slate-500">Risk Score:</span>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            value={editedEntity?.riskScore || 0} 
                                            onChange={e => setEditedEntity(prev => prev ? { ...prev, riskScore: parseInt(e.target.value) } : null)}
                                            className="bg-[#0a0f1c] border border-blue-500/30 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none text-right w-16"
                                        />
                                    ) : (
                                        <span className={cn(
                                            "text-[10px] font-bold font-mono",
                                            (entity.riskScore || 0) >= 80 ? "text-red-400" : (entity.riskScore || 0) >= 60 ? "text-amber-400" : "text-emerald-400"
                                        )}>
                                            {entity.riskScore ?? 0}%
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center h-6">
                                    <span className="text-[10px] text-slate-500">Credibility:</span>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            value={editedEntity?.credibilityScore || 0} 
                                            onChange={e => setEditedEntity(prev => prev ? { ...prev, credibilityScore: parseInt(e.target.value) } : null)}
                                            className="bg-[#0a0f1c] border border-blue-500/30 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none text-right w-16"
                                        />
                                    ) : (
                                        <span className={cn(
                                            "text-[10px] font-bold font-mono",
                                            (entity.credibilityScore || 0) >= 80 ? "text-emerald-400" : (entity.credibilityScore || 0) >= 60 ? "text-blue-400" : "text-slate-400"
                                        )}>
                                            {entity.credibilityScore ?? 0}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Risk bar */}
                            <div className="mt-3">
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${entity.riskScore || 0}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={cn(
                                            "h-full rounded-full",
                                            (entity.riskScore || 0) >= 80 ? "bg-gradient-to-r from-red-600 to-red-400" :
                                                (entity.riskScore || 0) >= 60 ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                                                    "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* AI Insights */}
                        {entity.aiInsights && entity.aiInsights.length > 0 && (
                            <div className="p-4 border-b border-[#1e3a5f]/50">
                                <button
                                    className="flex items-center justify-between w-full mb-3"
                                    onClick={() => setShowAllInsights(!showAllInsights)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Activity size={11} className="text-blue-400" />
                                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">AI Insights</span>
                                    </div>
                                    {showAllInsights ? <ChevronUp size={10} className="text-slate-600" /> : <ChevronDown size={10} className="text-slate-600" />}
                                </button>
                                <div className="space-y-1.5">
                                    {entity.aiInsights.map((insight: string, i: number) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="flex items-start gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                                            <span className="text-[10px] text-slate-400 leading-snug">{insight}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Links */}
                        {entity.links && entity.links.length > 0 && (
                            <div className="p-4 border-b border-[#1e3a5f]/50">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <ExternalLink size={11} className="text-blue-400" />
                                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Links</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {entity.links.map((link: string) => (
                                        <button
                                            key={link}
                                            className="px-2 py-1 text-[9px] rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
                                        >
                                            {link}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline Events */}
                        {entity.timelineEvents && entity.timelineEvents.length > 0 && (
                            <div className="p-4">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Clock size={11} className="text-purple-400" />
                                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Timeline Events</span>
                                </div>
                                <div className="space-y-2">
                                    {entity.timelineEvents.map((event: string, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2 text-[10px] text-slate-400 pl-2 border-l border-[#1e3a5f]/60 hover:border-blue-500/40 hover:text-slate-300 transition-all cursor-pointer py-0.5"
                                        >
                                            {event}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
