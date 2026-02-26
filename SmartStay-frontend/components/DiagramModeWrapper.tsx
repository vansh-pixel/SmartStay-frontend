"use client";

import dynamic from "next/dynamic";

const DiagramModeToggle = dynamic(() => import("@/components/DiagramModeToggle"), { ssr: false });

export default function DiagramModeWrapper() {
    return <DiagramModeToggle />;
}
