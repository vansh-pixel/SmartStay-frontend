"use client"
import { useEffect, useState } from "react";
import AdminNavbar from "./components/AdminNavbar";

export default function AdminGuard({ children }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check for adminToken specifically
    const token = localStorage.getItem("adminToken");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (!token || !isAdmin) {
      window.location.href = "/"; // Redirect to home if not admin
    } else {
      setAuthorized(true);
    }
  }, []);

  if (!authorized) return null; // Don't render until checked

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
