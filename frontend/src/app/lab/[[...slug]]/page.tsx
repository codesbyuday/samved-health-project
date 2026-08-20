"use client";

import dynamic from "next/dynamic";

const LabApp = dynamic(() => import("@/lab/App"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-[#8b949e]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        <p className="text-sm font-medium">Loading Lab Operations Workspace...</p>
      </div>
    </div>
  ),
});

export default function LabPage() {
  return <LabApp />;
}
