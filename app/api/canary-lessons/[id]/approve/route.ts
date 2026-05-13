import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { canaryLesson, user } from "@/db/schema";
import { getSession } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role guard: only admins can approve/reject
    const [dbUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: admin only" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reviewNote } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Explicit existence check before update (prevents silent no-op)
    const [existing] = await db
      .select({ id: canaryLesson.id })
      .from(canaryLesson)
      .where(eq(canaryLesson.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(canaryLesson)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote ? String(reviewNote).slice(0, 500) : null,
        updatedAt: new Date(),
      })
      .where(eq(canaryLesson.id, id))
      .returning();

    return NextResponse.json({ ok: true, lesson: updated });
  } catch (err) {
    console.error("[canary-lessons approve PATCH]", err);
    return NextResponse.json({ ok: false, error: "Failed to update lesson" }, { status: 500 });
  }
}
