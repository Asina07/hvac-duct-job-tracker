"use client";

import Link from "next/link";

export default function LayoutComp({
  children,
  mainHeader,
}: {
  children: React.ReactNode;
  mainHeader?: string;
}) {
  return (
    <div className="flex-1 flex flex-col bg-[#ffffff]  shadow-lg overflow-hidden">
      
      {/* Fixed Header */}
      <div className="shrink-0 bg-white shadow-md">
      <Link href={'/'}> <h1 className="text-2xl text-[#1a1f2e] p-4 font-bold text-gray-800 text-right bg-[#dee3f2]">
          {mainHeader}
        </h1></Link> 
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>

    </div>
  );
}