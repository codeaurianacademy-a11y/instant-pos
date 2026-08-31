import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  username: z.string().trim().min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "CASHIER"]).default("CASHIER"),
});

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = createUserSchema.parse(body);

    // Check username uniqueness
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
