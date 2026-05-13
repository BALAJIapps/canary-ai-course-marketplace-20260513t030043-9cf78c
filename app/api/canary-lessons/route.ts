import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { canaryLesson, user } from "@/db/schema";
import { getSession } from "@/lib/utils";
import { eq, desc, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "approved";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    // Build SQL WHERE conditions
    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(canaryLesson.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(canaryLesson.title, `%${search}%`),
          ilike(canaryLesson.description, `%${search}%`),
          ilike(canaryLesson.subject, `%${search}%`)
        )
      );
    }

    const baseQuery = db
      .select({
        id: canaryLesson.id,
        title: canaryLesson.title,
        description: canaryLesson.description,
        content: canaryLesson.content,
        subject: canaryLesson.subject,
        price: canaryLesson.price,
        status: canaryLesson.status,
        aiSummary: canaryLesson.aiSummary,
        reviewNote: canaryLesson.reviewNote,
        createdAt: canaryLesson.createdAt,
        teacherName: user.name,
        teacherEmail: user.email,
      })
      .from(canaryLesson)
      .leftJoin(user, eq(canaryLesson.teacherId, user.id))
      .orderBy(desc(canaryLesson.createdAt))
      .limit(limit)
      .offset(offset);

    const lessons = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : await baseQuery;

    return NextResponse.json({ ok: true, lessons });
  } catch (err) {
    console.error("[canary-lessons GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, content, subject, price } = body;

    if (!title || !description || !content) {
      return NextResponse.json(
        { ok: false, error: "title, description, and content are required" },
        { status: 400 }
      );
    }

    const [lesson] = await db
      .insert(canaryLesson)
      .values({
        teacherId: session.user.id,
        title: String(title).slice(0, 200),
        description: String(description).slice(0, 1000),
        content: String(content).slice(0, 10000),
        subject: String(subject || "general").slice(0, 100),
        price: Math.max(0, Math.floor(Number(price) || 0)),
        status: "pending",
      })
      .returning();

    return NextResponse.json({ ok: true, lesson }, { status: 201 });
  } catch (err) {
    console.error("[canary-lessons POST]", err);
    return NextResponse.json({ ok: false, error: "Failed to create lesson" }, { status: 500 });
  }
}
