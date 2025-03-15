"use client";
import { useState, useEffect } from "react";
import Biere from "@/component/biere";
import { signIn, signOut, useSession } from "next-auth/react";


const Home = () => {
  const { data: session, status } = useSession(); // ✅ Vérifie la session
  const [participants, setParticipants] = useState<{ name: string; email: string; score: number }[]>([]);
  const [questions, setQuestions] = useState<{ id: string; question: string; options: string[] }[]>([]);
  const [winner, setWinner] = useState<{ name: string; email: string; score: number } | null>(null);
  const [TOTAL_TIME,] = useState(10)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false); // ✅ Nouvel état
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 🔹 Ajout de l'état pour contrôler le démarrage du décompte
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);

  // 🔹 Vérifier si l'utilisateur est un admin
  const isAdmin = session?.user?.role === "admin";

  // 🔹 Fonction pour démarrer le décompte
  const startCountdown = () => {
    setTimeLeft(TOTAL_TIME)
    setIsCountdownRunning(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      name,
      password,
      redirect: false, // Désactive la redirection automatique pour la gérer nous-mêmes
    });

    if (res?.error) {
      setError(res.error);
    }
  };


  // Récupérer le gagnant depuis l'API
  const fetchWinner = async () => {
    try {
      const res = await fetch("/api/results");
      if (!res.ok) throw new Error("Erreur de chargement du gagnant");
      const data = await res.json();

      if (data.length > 0) {
        setWinner(data[0].winner);
        setTimeLeft(0)
      }
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {

    fetchParticipants();
    fetchWinner();
    if (session) {
      fetchQuestions();
    }
  }, [session]);

  // Récupérer les participants
  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/users/participents");
      if (!res.ok) throw new Error("Erreur de chargement des participants");
      const data = await res.json();
      setParticipants(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Récupérer les questions
  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions/check");

      if (res.status === 204) {
        setHasCompletedQuiz(true); // ✅ L'utilisateur a déjà répondu
        setQuestions([]);
        return;
      }

      if (res.status === 201) {
        setHasCompletedQuiz(false); // ✅ L'utilisateur a déjà répondu
        setQuestions([]);
        return;
      }

      if (!res.ok) throw new Error("Erreur de chargement des questions");

      const data = await res.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Décompte du timer
  useEffect(() => {
    if (timeLeft > 0 && isCountdownRunning) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(prev - 1, 0));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isCountdownRunning && isAdmin) {
      handleDraw();
      setIsCountdownRunning(false);
    } else {
      handleDrawNoAdmin()
    }
  }, [timeLeft, isCountdownRunning]);
  // Tirage au sort pondéré par le score

  const handleDrawNoAdmin = async () => {
    if (participants.length === 0) return;
    const weightedPool = participants.flatMap((p) => Array(p.score + 1).fill(p));
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedWinner = weightedPool[randomIndex];


    setWinner(selectedWinner);
    setIsCountdownRunning(false)
  }
  const handleDraw = async () => {
    if (participants.length === 0) return;
    const weightedPool = participants.flatMap((p) => Array(p.score + 1).fill(p));
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedWinner = weightedPool[randomIndex];

    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selectedWinner.id })
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement du gagnant");
      const data = await res.json();
      setWinner(selectedWinner);
    } catch (error) {
      console.error(error);
    }
  };

  // Envoi des réponses utilisateur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Empêche la soumission multiple
    setIsSubmitting(true);
    try {
      await Promise.all(
        Object.entries(quizAnswers).map(async ([questionId, selectedAnswer]) => {
          const res = await fetch("/api/answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, selectedAnswer }),
          });
          if (!res.ok) throw new Error("Erreur lors de l'envoi d'une réponse");
        })
      );

      await fetchParticipants();
      fetchQuestions();
      setQuizAnswers({});
    } catch (error) {
      console.error("Erreur lors de l'envoi des réponses :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatage du temps
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? `0${minutes}` : minutes}:${secs < 10 ? `0${secs}` : secs}`;
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col items-center p-8 bg-[#fffff]">
      <div className="inset-0 bg-black opacity-60"></div>

      {/* ✅ Bouton Déconnexion en haut à gauche */}
      <div className="absolute top-4 right-4">
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-md transition-transform hover:scale-105"
          >
            Déconnexion
          </button>
        )}
      </div>

      <div className="z-10 w-full max-w-5xl grid md:grid-cols-3 gap-8 p-6 rounded-lg shadow-xl items-start">
        {/* Affichage du formulaire de connexion si l'utilisateur n'est pas connecté */}
        {status === "loading" ? (
          <p>Chargement...</p>
        ) : !session ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-3xl font-semibold text-amber-700 mb-4">Connexion</h2>
            <div className="p-4 bg-amber-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">connecte toi maintenant !!!</h3>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <input type="hidden" name="password" value={password} />
              <div>
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-amber-500 text-white font-bold rounded-md transition-transform hover:scale-105"
            >
              je me connecte il y a quoi
            </button>

          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-3xl font-semibold text-amber-700 mb-4">Questions</h2>
            <div className="p-4 bg-amber-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Répondez au QCM :</h3>
              {loading ? (
                <p>Chargement des questions...</p>
              ) : hasCompletedQuiz ? (
                <p className="text-green-600 font-bold">✅ Vous avez déjà complété le questionnaire !</p>
              ) : (
                questions.length > 0 ?
                  questions.map((q) => (
                    <div key={q.id} className="mb-3">
                      <p className="font-medium">{q.question}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`q${q.id}`}
                              value={option}
                              checked={quizAnswers[q.id] === option}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: option })}
                              className="accent-amber-500"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                  :
                  "aucunes questions"
              )}
            </div>

            {!hasCompletedQuiz && questions.length > 0 && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-amber-500 text-white font-bold rounded-md transition-transform hover:scale-105"
              >
                Envoyer mes réponses
              </button>
            )}
          </form>
        )}

        {/* Bière + Gagnant */}
        <div className="flex flex-col items-center justify-center relative">
          <h2 className="text-3xl font-semibold text-amber-700 mb-4" style={{
            visibility: 'hidden'
          }}>.</h2>
          <Biere fillFraction={1 - timeLeft / TOTAL_TIME} />
          {winner && timeLeft === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-4xl font-bold text-amber-900 animate-bounce bg-white bg-opacity-80 p-4 rounded-lg shadow-lg">
                🍺 {winner.name} 🍺
              </p>
            </div>
          ) :
            isCountdownRunning &&
            (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-4xl font-bold text-amber-900 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg">
                  {timeLeft}
                </p>
              </div>
            )}
          {isAdmin && !isCountdownRunning && !winner ? (
            <button
              onClick={startCountdown}
              disabled={isCountdownRunning}
              className="mt-4 px-4 py-2 bg-amber-100 text-gray-600 font-bold rounded-md transition-transform hover:scale-105 cursor-pointer z-10"
            >
              Lancer le décompte
            </button>
          ) : (
            <button
              onClick={startCountdown}
              disabled={isCountdownRunning}
              className="mt-4 px-4 py-2 bg-amber-100 text-gray-600 font-bold rounded-md transition-transform hover:scale-105 cursor-pointer z-10"
            >
              servir un verre a...
            </button>
          )

          }
          <p className="mt-4 text-yellow-300 text-xl">
            {timeLeft === 0 && `Cul sec pour toi ${winner?.name} !`}
          </p>
        </div>

        {/* Liste des participants */}
        <section>
          <h2 className="text-3xl font-semibold text-amber-700 mb-4">Participants</h2>
          <ul className="space-y-2">
            {participants.length === 0 ? (
              <p>Aucun participant pour le moment...</p>
            ) : (
              participants.map((p, index) => (
                <li key={index} className="p-3 bg-amber-100 rounded-md shadow-sm">
                  <p className="font-bold">{p.name} (Score: {p.score})</p>
                  <p className="text-sm text-gray-600">{p.email}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Home;
