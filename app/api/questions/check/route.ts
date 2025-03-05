import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

const prisma = new PrismaClient();

/**
 * GET /api/questions/check
 * 🔹 Vérifie si l'utilisateur a répondu à toutes les questions
 */
export async function GET() {
  try {
    // Récupère la session utilisateur
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer le nombre total de questions
    const totalQuestions = await prisma.question.count();
    if (totalQuestions === 0) {
      return NextResponse.json({ message: "Aucune question disponible" }, { status: 201 });
    }

    // Récupérer le nombre de réponses données par l'utilisateur
    const answeredQuestions = await prisma.answer.count({
      where: { userId },
    });

    // ✅ Si toutes les questions ont une réponse, renvoyer un statut 204
    if (answeredQuestions >= totalQuestions) {
      return new Response(null, { status: 204 }); // ✅ 204 No Content
    }

    // ❌ Si des questions restent à répondre, les récupérer
    const unansweredQuestions = await prisma.question.findMany({
      where: {
        id: {
          notIn: (
            await prisma.answer.findMany({
              where: { userId },
              select: { questionId: true },
            })
          ).map((a) => a.questionId),
        },
      },
    });

    return NextResponse.json({ questions: unansweredQuestions }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des réponses" },
      { status: 500 }
    );
  }
}
