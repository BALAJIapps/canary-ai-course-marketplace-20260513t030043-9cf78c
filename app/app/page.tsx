import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { canaryLesson, canarySubscription, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BookOpen, Plus, Sparkles, ShieldCheck, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ role: user.role, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const role = dbUser?.role || "student";

  // Fetch relevant data based on role
  const myLessons = (role === "teacher" || role === "admin")
    ? await db
        .select()
        .from(canaryLesson)
        .where(role === "teacher" ? eq(canaryLesson.teacherId, session.user.id) : undefined)
        .orderBy(desc(canaryLesson.createdAt))
        .limit(10)
    : [];

  const mySubscriptions = role === "student"
    ? await db
        .select({
          id: canarySubscription.id,
          lessonId: canarySubscription.lessonId,
          status: canarySubscription.status,
          createdAt: canarySubscription.createdAt,
          lessonTitle: canaryLesson.title,
          lessonSubject: canaryLesson.subject,
        })
        .from(canarySubscription)
        .leftJoin(canaryLesson, eq(canarySubscription.lessonId, canaryLesson.id))
        .where(eq(canarySubscription.studentId, session.user.id))
        .orderBy(desc(canarySubscription.createdAt))
        .limit(10)
    : [];

  const statusColor: Record<string, string> = {
    pending: "#dd5b00",
    approved: "#1aae39",
    rejected: "#dc2626",
    active: "#1aae39",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f6f5f4", fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      {/* Top nav */}
      <nav style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" style={{ color: "#0075de" }} />
            <span style={{ fontSize: "15px", fontWeight: 600 }}>LearnAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "13px", color: "#615d59" }}>{dbUser?.name}</span>
            <Badge style={{ backgroundColor: "#f2f9ff", color: "#097fe8", borderRadius: "9999px", fontSize: "11px", fontWeight: 600 }}>{role}</Badge>
            {role === "admin" && (
              <Link href="/app/admin">
                <Button size="sm" variant="outline" style={{ fontSize: "13px" }}>Admin panel</Button>
              </Link>
            )}
            <Link href="/marketplace">
              <Button size="sm" variant="ghost" style={{ fontSize: "13px" }}>Marketplace</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.625px", color: "rgba(0,0,0,0.95)", marginBottom: "4px" }}>Dashboard</h1>
            <p style={{ fontSize: "14px", color: "#615d59" }}>Welcome back, {dbUser?.name}</p>
          </div>
          {(role === "teacher" || role === "admin") && (
            <Link href="/app/lessons/new">
              <Button style={{ backgroundColor: "#0075de", color: "white", borderRadius: "4px", fontWeight: 600, fontSize: "14px" }}>
                <Plus className="mr-2 h-4 w-4" /> New lesson
              </Button>
            </Link>
          )}
        </div>

        {/* Teacher / Admin: lessons */}
        {(role === "teacher" || role === "admin") && (
          <div className="mb-8">
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "rgba(0,0,0,0.8)", marginBottom: "12px" }}>
              {role === "admin" ? "All lessons" : "My lessons"}
            </h2>
            {myLessons.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "32px", textAlign: "center" }}>
                <BookOpen className="h-8 w-8 mx-auto mb-3" style={{ color: "#a39e98" }} />
                <p style={{ fontSize: "14px", color: "#615d59" }}>No lessons yet. Create your first lesson.</p>
                <Link href="/app/lessons/new">
                  <Button size="sm" className="mt-3" style={{ backgroundColor: "#0075de", color: "white" }}>Create lesson</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myLessons.map((lesson) => (
                  <div key={lesson.id} style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", padding: "16px" }} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "rgba(0,0,0,0.9)" }}>{lesson.title}</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: statusColor[lesson.status] || "#615d59", backgroundColor: `${statusColor[lesson.status]}15`, borderRadius: "9999px", padding: "2px 8px" }}>{lesson.status}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#615d59" }}>{lesson.subject} · {lesson.price === 0 ? "Free" : `$${(lesson.price / 100).toFixed(2)}`}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!lesson.aiSummary && (
                        <Link href={`/app/lessons/${lesson.id}`}>
                          <Button size="sm" variant="outline" style={{ fontSize: "12px" }}>
                            <Sparkles className="mr-1 h-3 w-3" /> Summarize
                          </Button>
                        </Link>
                      )}
                      {role === "admin" && lesson.status === "pending" && (
                        <Link href="/app/admin">
                          <Button size="sm" variant="outline" style={{ fontSize: "12px" }}>
                            <ShieldCheck className="mr-1 h-3 w-3" /> Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student: subscriptions */}
        {role === "student" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "rgba(0,0,0,0.8)" }}>My subscriptions</h2>
              <Link href="/marketplace">
                <Button size="sm" variant="ghost" style={{ fontSize: "13px", color: "#0075de" }}>Browse more</Button>
              </Link>
            </div>
            {mySubscriptions.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "32px", textAlign: "center" }}>
                <Users className="h-8 w-8 mx-auto mb-3" style={{ color: "#a39e98" }} />
                <p style={{ fontSize: "14px", color: "#615d59" }}>No subscriptions yet.</p>
                <Link href="/marketplace">
                  <Button size="sm" className="mt-3" style={{ backgroundColor: "#0075de", color: "white" }}>Browse lessons</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubscriptions.map((sub) => (
                  <div key={sub.id} style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", padding: "16px" }} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(0,0,0,0.9)" }}>{sub.lessonTitle}</p>
                      <p style={{ fontSize: "13px", color: "#615d59" }}>{sub.lessonSubject}</p>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: statusColor[sub.status] || "#615d59", backgroundColor: `${statusColor[sub.status]}15`, borderRadius: "9999px", padding: "2px 8px" }}>{sub.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
