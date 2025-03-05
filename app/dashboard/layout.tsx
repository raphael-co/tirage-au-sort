"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Attendre le chargement
    if (!session) {
      router.push("/auth/login"); // Rediriger vers la connexion
    } else if (session.user?.role !== "admin") {
      signOut({ callbackUrl: "/auth/login" }); // Déconnecter si non admin
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <p>Chargement...</p>;
  }

  return (
    <div className="min-h-screen w-full">
      {/* Navbar */}
      <nav className="bg-gray-900 text-white py-4 px-6 flex justify-between items-center shadow-lg">
        {/* Logo */}
        <div className="text-xl font-bold">
          <Link href="/dashboard">Admin Panel</Link>
        </div>

        {/* Liens de navigation */}
        <div className="space-x-6">
          <Link href="/dashboard/users" className="hover:text-gray-400">
            Utilisateurs
          </Link>
          <Link href="/dashboard/questions" className="hover:text-gray-400">
            Questions
          </Link>
          <Link href="/dashboard/results" className="hover:text-gray-400">
            Results
          </Link>
        </div>

        {/* Profil utilisateur + Déconnexion */}
        <div className="flex items-center space-x-4">
          {session && <span className="text-sm font-medium">{session.user?.name}</span>}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
