import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function adminMiddleware(req: NextRequest) {
  const name = req.headers.get("name");

  if (!name) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { name } });

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.next();
}
