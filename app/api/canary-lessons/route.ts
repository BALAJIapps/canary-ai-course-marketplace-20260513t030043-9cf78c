import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { canaryLesson, user } from "@/db/schema";
import { getSession } from "@/lib/utils";
import { eq, desc, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "approved";

    let query = db
      .select({
        id: canaryLesson.id,
        title: canaryLesson.title,
        description: canaryLesson.description,
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
      .orderBy(desc(canaryLesson.createdAt));

    const lessons = await query;

    let filtered = lessons;
    if (status !== "all") {
      filtered = filtered.filter((l) => l.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(s) ||
          l.description.toLowerCase().includes(s) ||
          l.subject.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ ok: true, lessons: filtered });
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
