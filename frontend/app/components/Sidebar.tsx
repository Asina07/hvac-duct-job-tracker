"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FolderOpen,
  LayoutDashboard,
  Plus,
  WrenchIcon,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/jobs", label: "Jobs", icon: <Briefcase size={20} /> },
    { href: "/jobs/new", label: "Add Job", icon: <Plus size={20} /> },
    { href: "/projects", label: "Projects", icon: <FolderOpen size={20} /> },
    { href: "/materials", label: "Materials", icon: <WrenchIcon size={20} /> },
  ];

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className=" fixed top-4 left-4 z-50 p-2 bg-[#1a1f2e] text-white rounded-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {isOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-30 "
          onClick={() => setIsOpen(false)}
        />
      )}
     <aside
  className={`
  fixed
  top-0 left-0 z-40
  w-64 min-h-screen
  bg-[#1a1f2e] text-white
  flex flex-col
  transform transition-transform duration-300
  ${isOpen ? "translate-x-0" : "-translate-x-full"}
  shadow-2xl
`}
>
        {/* Logo area */}
        <div className="p-6 border-b border-gray-700 flex flex-col items-center">
          <h1 className="text-lg font-bold text-blue-400">{` ${user?.name}`}</h1>
          <p className="text-xs text-gray-400 mt-1">HVAC Material Management</p>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors
              ${
                pathname === link.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span>{link.icon}</span>
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
