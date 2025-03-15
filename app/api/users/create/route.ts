import { NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// 🔹 Créer un nouvel utilisateur (Admin requis)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 403 });
  }

  const { name, password } = await req.json();
  if (!name  || !password) {
    return NextResponse.json({ status: "error", message: "Tous les champs sont requis" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: { name, password: hashedPassword },
    });
    return NextResponse.json({ status: "success", user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Erreur lors de la création" }, { status: 500 });
  }
}
