"use client";
import { useEffect, useState } from "react";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentOptions, setCurrentOptions] = useState<string[]>(["", ""]);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {

    setLoading(true);
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error("Erreur lors du chargement des questions :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!currentQuestion.trim() || currentOptions.some(opt => !opt.trim()) || !currentAnswer.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const payload = {
      question: currentQuestion,
      options: currentOptions,
      answer: currentAnswer,
    };

    const response = await fetch(editingId ? `/api/questions/${editingId}` : "/api/questions", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      fetchQuestions();
      resetForm();
    } else {
      alert(`Erreur lors de la ${editingId ? "modification" : "création"} de la question`);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Supprimer cette question ?")) return;

    const response = await fetch(`/api/questions/${id}`, { method: "DELETE" });

    if (response.ok) {
      setQuestions(questions.filter(q => q.id !== id));
    } else {
      alert("Erreur lors de la suppression");
    }
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question.question);
    setCurrentOptions(question.options);
    setCurrentAnswer(question.answer);
    setEditingId(question.id);
  };

  const resetForm = () => {
    setCurrentQuestion("");
    setCurrentOptions(["", ""]);
    setCurrentAnswer("");
    setEditingId(null);
  };

  const removeOption = (index: number) => {
    if (currentOptions.length <= 2) {
      alert("Une question doit avoir au moins deux options.");
      return;
    }
    setCurrentOptions(currentOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">
        {editingId ? "Modifier la question" : "Ajouter une question"}
      </h1>

      {/* Formulaire d'ajout/modification */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 w-full max-w-lg">
        <input
          type="text"
          placeholder="Intitulé de la question"
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-700 text-white"
        />

        {currentOptions.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const updatedOptions = [...currentOptions];
                updatedOptions[i] = e.target.value;
                setCurrentOptions(updatedOptions);
              }}
              className="w-full p-2 mb-2 border rounded bg-gray-700 text-white"
            />
            {currentOptions.length > 2 && (
              <button
                onClick={() => removeOption(i)}
                className="bg-red-500 px-2 py-1 rounded hover:bg-red-600"
              >
                X
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setCurrentOptions([...currentOptions, ""])}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 mb-2"
        >
          + Ajouter une option
        </button>

        <input
          type="text"
          placeholder="Réponse correcte"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-700 text-white"
        />

        <button
          onClick={handleSaveQuestion}
          className={`w-full px-4 py-2 rounded ${editingId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}`}
        >
          {editingId ? "Mettre à jour" : "Ajouter"}
        </button>

        {editingId && (
          <button
            onClick={resetForm}
            className="w-full mt-2 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
          >
            Annuler
          </button>
        )}
      </div>

      {/* Liste des questions */}
      {loading ? (
        <p>Chargement des questions...</p>
      ) : (
        <ul className="w-full max-w-2xl">
          {questions.map((q) => (
            <li key={q.id} className="bg-gray-800 p-4 rounded-lg mb-3 shadow-lg">
              <p className="text-lg font-semibold">{q.question}</p>
              <ul className="ml-4">
                {q.options.map((opt, i) => (
                  <li key={i} className={opt === q.answer ? "text-green-400" : "text-white"}>
                    {opt}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <button
                  onClick={() => handleEditQuestion(q)}
                  className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="ml-2 bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminQuestions;
