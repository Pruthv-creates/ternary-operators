import { useCollaborators } from "@/hooks/useCollaborators";
import { Users } from "lucide-react";

interface CollaboratorsIndicatorProps {
  caseId: string | null;
}

export function CollaboratorsIndicator({ caseId }: CollaboratorsIndicatorProps) {
  const { collaborators } = useCollaborators(caseId);

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
      <Users size={16} className="text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        {collaborators.length} {collaborators.length === 1 ? "investigator" : "investigators"} online
      </span>
      <div className="flex -space-x-2">
        {collaborators.slice(0, 3).map((collab) => (
          <div
            key={collab.id}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-xs text-white font-semibold"
            title={collab.name}
          >
            {collab.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {collaborators.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-700 font-semibold">
            +{collaborators.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
