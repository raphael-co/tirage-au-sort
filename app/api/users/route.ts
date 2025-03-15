import { NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";


/**
 * GET /api/users
 * Liste tous les utilisateurs
 */

// 🔹 Récupérer les scores de tous les utilisateurs
export async function GET() {
    try {
        // Récupérer tous les utilisateurs
        const users = await prisma.user.findMany({
            select: { id: true, name: true, role: true, createdAt: true },
        });

        // Récupérer les scores (nombre de bonnes réponses) pour chaque utilisateur
        const usersWithScores = await Promise.all(
            users.map(async (user: { id: string; }) => {
                const correctAnswers = await prisma.answer.count({
                    where: { userId: user.id, correct: true },
                });

                return { ...user, score: correctAnswers };
            })
        );

        console.log(usersWithScores);
        
        return NextResponse.json(usersWithScores, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Erreur lors de la récupération des scores" },
            { status: 500 }
        );
    }
}


/**
 * POST /api/users
 * Crée un nouvel utilisateur (réservé à l'admin ou super_admin)
 */
// export async function POST(req: Request) {
//   try {

//     const { name, email, password, role } = await req.json();

//     if (!name || !email || !password) {
//       return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
//     }

//     // Vérifier si l'utilisateur existe déjà
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
//     }

//     // Hasher le mot de passe
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Création de l'utilisateur
//     const newUser = await prisma.user.create({
//       data: { name, email, password: hashedPassword, role: role || "user" },
//     });

//     return NextResponse.json({ message: "Utilisateur créé avec succès", user: newUser }, { status: 201 });

//   } catch (error) {
//     return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 });
//   }
// }
