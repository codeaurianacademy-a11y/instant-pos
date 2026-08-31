import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  username: z.string().trim().min(3)
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, underscores")
    .optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "CASHIER"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Prevent self-demotion or self-deactivation
    if (id === session.sub) {
      if (data.isActive === false) {
        return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
      }
      if (data.role && data.role !== "ADMIN") {
        return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
      }
    }

    // Check username uniqueness if changing
    if (data.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    if (id === session.sub) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    // Soft-delete: deactivate instead of hard-delete to preserve sales history
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
