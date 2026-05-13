import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { canaryLesson, canarySubscription, user } from "@/db/schema";
import { getSession } from "@/lib/utils";
import { eq, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const [totalLessons] = await db.select({ count: count() }).from(canaryLesson);
    const [pendingLessons] = await db
      .select({ count: count() })
      .from(canaryLesson)
      .where(eq(canaryLesson.status, "pending"));
    const [approvedLessons] = await db
      .select({ count: count() })
      .from(canaryLesson)
      .where(eq(canaryLesson.status, "approved"));
    const [totalSubs] = await db.select({ count: count() }).from(canarySubscription);
    const [totalUsers] = await db.select({ count: count() }).from(user);

    return NextResponse.json({
      ok: true,
      stats: {
        totalLessons: totalLessons.count,
        pendingLessons: pendingLessons.count,
        approvedLessons: approvedLessons.count,
        totalSubscriptions: totalSubs.count,
        totalUsers: totalUsers.count,
      },
    });
  } catch (err) {
    console.error("[canary-admin stats]", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
