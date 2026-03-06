"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow-sm hover:bg-gray-50 transition"
    >
      ← Back
    </button>
  );
}