import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { id } = await params; // Accès à id via params.id
        await prisma.answer.delete({ where: { id } });

        return NextResponse.json({ message: "Tirage supprimé avec succès" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la suppression du tirage" }, { status: 500 });
    }
}