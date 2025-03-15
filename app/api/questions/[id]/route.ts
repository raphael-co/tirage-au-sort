import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/utils/prisma";


/**
 * PUT /api/questions/:id
 * 🔹 Modifie une question (admin requis)
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user?.role !== "admin" && session.user?.role !== "super_admin")) {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }
        const { id } = await params

        const { question, options, answer } = await req.json();
        if (!question || !options || !Array.isArray(options) || options.length < 2 || !answer) {
            return NextResponse.json({ error: "Données invalides" }, { status: 400 });
        }

        const updatedQuestion = await prisma.question.update({
            where: { id: id },
            data: { question, options, answer },
        });

        return NextResponse.json({ message: "Question mise à jour", question: updatedQuestion }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 });
    }
}

/**
 * DELETE /api/questions/:id
 * 🔹 Supprime une question (admin requis)
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        
        const session = await getServerSession(authOptions);
        if (!session || (session.user?.role !== "admin")) {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }
        const { id } = await params
        
        await prisma.question.delete({ where: { id: id } });

        return NextResponse.json({ message: "Question supprimée" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }
}
