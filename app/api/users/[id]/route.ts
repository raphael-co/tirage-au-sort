import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/prisma";


// 🔹 Modifier un utilisateur (Admin requis)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 403 });
  }

  const { name, password } = await req.json();
  if (!name) {
    return NextResponse.json({ status: "error", message: "Nom et Email requis" }, { status: 400 });
  }

  const data: { name: string; password?: string } = { name, password };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data,
    });
    return NextResponse.json({ status: "success", user: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

// 🔹 Supprimer un utilisateur (Admin requis)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.user.delete({
      where: { id: id },
    });
    return NextResponse.json({ status: "success", message: "Utilisateur supprimé" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Erreur lors de la suppression" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest, { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des scores" },
      { status: 500 }
    );
  }
}
