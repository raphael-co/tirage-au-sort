"use client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  score: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentName, setCurrentName] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!currentName.trim() || (!editingId && !currentPassword.trim())) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const payload = {
      name: currentName,
      ...(currentPassword && { password: currentPassword }),
    };

    const response = await fetch(editingId ? `/api/users/${editingId}` : "/api/users/create", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      fetchUsers();
      resetForm();
    } else {
      alert(`Erreur lors de la ${editingId ? "modification" : "création"} de l'utilisateur`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });

    if (response.ok) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert("Erreur lors de la suppression");
    }
  };

  const handleEditUser = (user: User) => {
    setCurrentName(user.name);
    setEditingId(user.id);
  };

  const resetForm = () => {
    setCurrentName("");
    setCurrentPassword("");
    setEditingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">
        {editingId ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
      </h1>

      {/* Formulaire d'ajout/modification */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 w-full max-w-lg">
        <input
          type="text"
          placeholder="Nom"
          value={currentName}
          onChange={(e) => setCurrentName(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-700 text-white"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-700 text-white"
        />

        <button
          onClick={handleSaveUser}
          className={`w-full px-4 py-2 rounded ${editingId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}`}
        >
          {editingId ? "Mettre à jour" : "Ajouter"}
        </button>

        {editingId && (
          <button onClick={resetForm} className="w-full mt-2 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
            Annuler
          </button>
        )}
      </div>

      {/* Liste des utilisateurs */}
      <ul className="w-full max-w-2xl mx-auto space-y-3">
        {users.map((user) => (
          <li
            key={user.id}
            className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-wrap sm:flex-nowrap justify-between items-center"
          >
            <p className="text-lg font-semibold flex-1 min-w-[150px]">
              {user.name} ({user.score})
            </p>
            <div className="flex gap-2 sm:flex-row flex-col w-full sm:w-auto">
              <button
                onClick={() => handleEditUser(user)}
                className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600 w-full sm:w-auto"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 w-full sm:w-auto"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

    </div>
  );
};

export default AdminUsers;
