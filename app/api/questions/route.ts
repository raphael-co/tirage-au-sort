import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

const prisma = new PrismaClient();

/**
 * GET /api/questions
 * 🔹 Récupère toutes les questions (accessible à tous)
 */
export async function GET() {
  try {
    const questions = await prisma.question.findMany();
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des questions" }, { status: 500 });
  }
}

/**
 * POST /api/questions
 * 🔹 Ajoute une nouvelle question (admin requis)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "admin" && session.user?.role !== "super_admin")) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { question, options, answer } = await req.json();
    if (!question || !options || !Array.isArray(options) || options.length < 2 || !answer) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const newQuestion = await prisma.question.create({
      data: { question, options, answer },
    });

    return NextResponse.json({ message: "Question ajoutée avec succès", question: newQuestion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'ajout de la question" }, { status: 500 });
  }
}
