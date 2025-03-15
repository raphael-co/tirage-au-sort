import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/utils/prisma";


// 🔹 Enregistrer une réponse utilisateur
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 403 });
  }

  const { questionId, selectedAnswer } = await req.json();
  if (!questionId || !selectedAnswer) {
    return NextResponse.json({ status: "error", message: "Question et réponse requises" }, { status: 400 });
  }

  // Vérifier la bonne réponse
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { answer: true },
  });

  if (!question) {
    return NextResponse.json({ status: "error", message: "Question introuvable" }, { status: 404 });
  }

  const isCorrect = question.answer === selectedAnswer;

  try {
    const answer = await prisma.answer.create({
      data: {
        userId: session.user.id,
        questionId,
        selected: selectedAnswer,
        correct: isCorrect,
      },
    });

    return NextResponse.json({ status: "success", answer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Erreur lors de l'enregistrement" }, { status: 500 });
  }
}

// 🔹 Récupérer les réponses d'un utilisateur
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
  
    if (!userId) {
      return NextResponse.json({ status: "error", message: "userId requis" }, { status: 400 });
    }
  
    try {
      const answers = await prisma.answer.findMany({
        where: { userId },
        include: { question: true },
      });
  
      return NextResponse.json({ status: "success", answers }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ status: "error", message: "Erreur lors de la récupération" }, { status: 500 });
    }
  }
  