import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/utils/prisma";


/**
 * 🔹 GET /api/results
 * Récupère tous les tirages (triés par ordre décroissant)
 */
export async function GET() {
    try {
        const results = await prisma.result.findMany({
            include: { winner: { select: { id: true, name: true } } },
            orderBy: { drawTime: "desc" },
        });

        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la récupération des tirages" }, { status: 500 });
    }
}

/**
 * 🔹 POST /api/results
 * Crée un nouveau tirage (uniquement accessible aux admins)
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { winnerId } = await req.json();

        // Vérifier si l'ID du gagnant est valide (optionnel)
        if (winnerId) {
            const userExists = await prisma.user.findUnique({ where: { id: winnerId } });
            if (!userExists) {
                return NextResponse.json({ error: "Utilisateur gagnant introuvable" }, { status: 400 });
            }
        }

        const newResult = await prisma.result.create({
            data: {
                winnerId: winnerId || null,
                isDrawn: !!winnerId,
            },
        });

        return NextResponse.json({ message: "Tirage créé avec succès", result: newResult }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la création du tirage" }, { status: 500 });
    }
}