"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Result {
  id: string;
  drawTime: string;
  winner?: { id: string; name: string };
  isDrawn: boolean;
}

interface User {
  id: string;
  name: string;
}

const ResultsAdmin = () => {
  const { data: session } = useSession();
  const [results, setResults] = useState<Result[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWinnerId, setNewWinnerId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
    fetchUsers();
  }, []);

  // 🔹 Récupérer tous les résultats
  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des résultats :", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Récupérer tous les utilisateurs (pour assigner un gagnant)
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    }
  };

  // 🔹 Créer un tirage (avec ou sans gagnant)
  const handleCreateResult = async () => {
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: newWinnerId }),
      });

      if (res.ok) {
        fetchResults();
        setNewWinnerId(null);
      } else {
        console.error("Erreur lors de la création du tirage");
      }
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  // 🔹 Mettre à jour un tirage (ex: attribuer un gagnant)
  const handleUpdateResult = async (id: string, winnerId: string | null) => {
    try {
      const res = await fetch(`/api/results/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, isDrawn: !!winnerId }),
      });

      if (res.ok) {
        fetchResults();
      } else {
        console.error("Erreur lors de la mise à jour du tirage");
      }
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  // 🔹 Supprimer un tirage
  const handleDeleteResult = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce tirage ?")) return;

    try {
      const res = await fetch(`/api/results/${id}`, { method: "DELETE" });

      if (res.ok) {
        setResults(results.filter((r) => r.id !== id));
      } else {
        console.error("Erreur lors de la suppression du tirage");
      }
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-md text-white">
      <h2 className="text-2xl font-bold mb-4">Gestion des Tirages</h2>

      {/* 🔹 Ajout d'un tirage */}
      <div className="mb-4 p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Ajouter un Tirage</h3>
        <select
          className="border p-2 w-full rounded"
          value={newWinnerId || ""}
          onChange={(e) => setNewWinnerId(e.target.value || null)}
        >
          <option value="">- Aucun gagnant -</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreateResult}
          className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Ajouter le tirage
        </button>
      </div>

      {/* 🔹 Liste des tirages */}
      {loading ? (
        <p>Chargement...</p>
      ) : results.length === 0 ? (
        <p>Aucun tirage enregistré.</p>
      ) : (
        <ul className="space-y-4">
          {results.map((result) => (
            <li key={result.id} className="p-4 rounded shadow">
              <p>
                <span className="font-bold">Tirage:</span> {new Date(result.drawTime).toLocaleString()}
              </p>
              <p>
                <span className="font-bold">Gagnant:</span>{" "}
                {result.winner ? result.winner.name : "Pas encore tiré"}
              </p>

              {/* 🔹 Sélection du gagnant */}
              <select
                className="border p-2 w-full rounded mt-2"
                value={result.winner?.id || ""}
                onChange={(e) => handleUpdateResult(result.id, e.target.value || null)}
              >
                <option value="">- Aucun gagnant -</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              {/* 🔹 Bouton Supprimer */}
              <button
                onClick={() => handleDeleteResult(result.id)}
                className="mt-2 w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResultsAdmin;
