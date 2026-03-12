"use client";

import { useSidebarCases } from "@/hooks/sidebar/useSidebarCases";
import { SidebarCases } from "@/components/sidebar/SidebarCases";
import { SidebarNav } from "@/components/sidebar/SidebarNav";
import { CreateCaseModal } from "@/components/modals/CreateCaseModal";

export default function Sidebar() {
    const {
        userCases,
        loading,
        creating,
        currentCaseId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        handleSelectCase,
        handleCreateCase,
        handleCreateCaseWithTitle,
        handleRenameCase
    } = useSidebarCases();

    return (
        <>
            <aside
                className="flex flex-col w-64 min-w-[256px] h-full bg-[#0d1424] border-r border-[#1e3a5f]/40 z-10"
            >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e3a5f]/50">
                <img 
                    src="/logo.png" 
                    alt="Astraeus Logo" 
                    className="h-10 w-auto object-contain brightness-0 invert"
                />
            </div>

            <SidebarCases 
                userCases={userCases}
                loading={loading}
                creating={creating}
                currentCaseId={currentCaseId}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                handleSelectCase={handleSelectCase}
                handleCreateCase={handleCreateCase}
                handleCreateCaseWithTitle={handleCreateCaseWithTitle}
                handleRenameCase={handleRenameCase}
            />

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e3a5f]/60 to-transparent mx-4 my-2" />

            <SidebarNav />
        </aside>

        <CreateCaseModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateCaseWithTitle}
        />
    </>
    );
}
