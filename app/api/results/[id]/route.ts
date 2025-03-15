import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/utils/prisma";


/**
 * 🔹 PUT /api/results/:id
 * Met à jour un tirage (ex: définir un gagnant)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { id } = await params
        const { winnerId, isDrawn } = await req.json();

        // Vérifier si l'ID du gagnant est valide (optionnel)
        if (winnerId) {
            const userExists = await prisma.user.findUnique({ where: { id: winnerId } });
            if (!userExists) {
                return NextResponse.json({ error: "Utilisateur gagnant introuvable" }, { status: 400 });
            }
        }

        const updatedResult = await prisma.result.update({
            where: { id },
            data: { winnerId: winnerId || null, isDrawn: !!isDrawn },
        });

        return NextResponse.json({ message: "Tirage mis à jour", result: updatedResult }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la mise à jour du tirage" }, { status: 500 });
    }
}


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { id } = await params; // Accès à id via params.id
        await prisma.result.delete({ where: { id } });

        return NextResponse.json({ message: "Tirage supprimé avec succès" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la suppression du tirage" }, { status: 500 });
    }
}