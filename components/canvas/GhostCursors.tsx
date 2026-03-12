"use client";

interface GhostCursorsProps {
    collaborators: Record<string, any>;
    throttleMs: number;
}

export default function GhostCursors({ collaborators, throttleMs }: GhostCursorsProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            {Object.values(collaborators).map((user) => (
                <div
                    key={user.userId}
                    className="absolute"
                    style={{
                        left: user.x,
                        top: user.y,
                        transition: `left ${throttleMs}ms linear, top ${throttleMs}ms linear`,
                    }}
                >
                    {/* Cursor SVG */}
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))` }}
                    >
                        <path
                            d="M0 0 L0 11 L3 8.5 L5.5 14 L7 13.5 L4.5 8 L8 8 Z"
                            fill={user.color}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth="1"
                        />
                    </svg>
                    {/* Name tag — positioned to the right of the cursor tip */}
                    <div
                        style={{
                            position: "absolute",
                            top: "0px",
                            left: "18px",
                            backgroundColor: user.color,
                            borderRadius: "4px",
                            padding: "2px 7px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        }}
                    >
                        <span
                            style={{
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: 700,
                                fontFamily: "sans-serif",
                                letterSpacing: "0.03em",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}
                        >
                            {user.name}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
