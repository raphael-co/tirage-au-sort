"use client";
import { useEffect, useState } from "react";

interface Answer {
  id: string;
  selected: string;
  correct: boolean;
  createdAt: string;
  question: {
    question: string;
    options: string[];
    answer: string;
  }
}

interface User {
  id: string;
  name: string;
  role?: string;
  createdAt?: string;
  score?: string;
  answers?: Answer[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentName, setCurrentName] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Etats pour la modal des détails
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Fonction pour charger les détails (questions/réponses) d'un utilisateur
  const handleViewDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      setUserDetails(data);
      setSelectedUserId(userId);
    } catch (error) {
      console.error("Erreur lors du chargement des détails :", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!window.confirm("Supprimer cette réponse ?")) return;
    try {
      const res = await fetch(`/api/answers/${answerId}`, { method: "DELETE" });
      if (res.ok) {
        if (userDetails) {
          setUserDetails({
            ...userDetails,
            answers: userDetails.answers?.filter((a: Answer) => a.id !== answerId),
          });
        }
      } else {
        alert("Erreur lors de la suppression de la réponse");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la réponse", error);
      alert("Erreur lors de la suppression de la réponse");
    }
  };

  const closeModal = () => {
    setSelectedUserId(null);
    setUserDetails(null);
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
              {user.name} ({user.score ? user.score : 0})
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
              <button
                onClick={() => handleViewDetails(user.id)}
                className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
              >
                Voir Q&R
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal pour afficher les questions et réponses */}
      {selectedUserId && userDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Détails pour {userDetails.name}</h2>
            {loadingDetails ? (
              <p>Chargement...</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {userDetails.answers && userDetails.answers.length > 0 ? (
                  userDetails.answers.map((answer: Answer) => (
                    <div
                      key={answer.id}
                      className="mb-4 p-2 border-b border-gray-600 flex justify-between items-start"
                    >
                      <div>
                        <p className="font-semibold">
                          Question: {answer.question?.question}
                        </p>
                        <p>Réponse sélectionnée: {answer.selected}</p>
                        <p>{answer.correct ? "Correct" : "Incorrect"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnswer(answer.id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        ✖
                      </button>
                    </div>
                  ))
                ) : (
                  <p>Aucune réponse trouvée.</p>
                )}
              </div>
            )}
            <button onClick={closeModal} className="mt-4 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
