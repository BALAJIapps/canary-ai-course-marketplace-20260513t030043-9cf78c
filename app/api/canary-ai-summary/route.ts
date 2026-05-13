import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { canaryLesson, user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { openai } from "@/lib/ai";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const [dbUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const body = await req.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json({ ok: false, error: "lessonId is required" }, { status: 400 });
    }

    const [lesson] = await db
      .select()
      .from(canaryLesson)
      .where(eq(canaryLesson.id, lessonId))
      .limit(1);

    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    // Ownership check: only the lesson's teacher or an admin can generate summaries
    if (lesson.teacherId !== session.user.id && dbUser?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: not your lesson" }, { status: 403 });
    }

    // AI summary with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    let summary = "";
    try {
      const result = await openai.chat.completions.create(
        {
          model: "gemini-2.0-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert educational content summarizer. Create clear, concise summaries of lesson content that help students understand what they will learn.",
            },
            {
              role: "user",
              content: `Summarize this lesson in 2-3 sentences highlighting the key learning outcomes:\n\nTitle: ${lesson.title}\nSubject: ${lesson.subject}\n\nContent:\n${lesson.content.slice(0, 3000)}`,
            },
          ],
          max_tokens: 300,
        },
        { signal: controller.signal }
      );
      summary = result.choices[0]?.message?.content ?? "Unable to generate summary.";
    } catch (aiErr: unknown) {
      if (aiErr instanceof Error && aiErr.name === "AbortError") {
        summary = "AI summary timed out. Please try again.";
      } else {
        console.error("[canary-ai-summary AI call failed]", aiErr);
        summary = "AI summary temporarily unavailable.";
      }
    } finally {
      clearTimeout(timer);
    }

    // Persist the summary
    const [updated] = await db
      .update(canaryLesson)
      .set({ aiSummary: summary, updatedAt: new Date() })
      .where(eq(canaryLesson.id, lessonId))
      .returning();

    return NextResponse.json({ ok: true, summary, lesson: updated });
  } catch (err) {
    console.error("[canary-ai-summary POST]", err);
    return NextResponse.json({ ok: false, error: "Failed to generate summary" }, { status: 500 });
  }
}
