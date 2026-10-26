"use client";

import dynamic from "next/dynamic";

const PharmaApp = dynamic(() => import("@/pharma/App"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#071619] text-[#a7c1c0]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#47c2bf] border-t-transparent"></div>
        <p className="text-sm font-medium">Loading Pharma Clinical Workspace...</p>
      </div>
    </div>
  ),
});

export default function PharmaPage() {
  return <PharmaApp />;
}
