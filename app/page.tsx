import Link from "next/link";
import { db } from "@/db";
import { canaryLesson, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BookOpen, Users, Sparkles, ShieldCheck, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  // Fetch approved lessons for marketplace preview
  let recentLessons: Array<{
    id: string;
    title: string;
    description: string;
    subject: string;
    price: number;
    aiSummary: string | null;
    teacherName: string | null;
  }> = [];

  try {
    recentLessons = await db
      .select({
        id: canaryLesson.id,
        title: canaryLesson.title,
        description: canaryLesson.description,
        subject: canaryLesson.subject,
        price: canaryLesson.price,
        aiSummary: canaryLesson.aiSummary,
        teacherName: user.name,
      })
      .from(canaryLesson)
      .leftJoin(user, eq(canaryLesson.teacherId, user.id))
      .where(eq(canaryLesson.status, "approved"))
      .orderBy(desc(canaryLesson.createdAt))
      .limit(6);
  } catch {
    // DB not yet seeded
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" style={{ color: "#0075de" }} />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "rgba(0,0,0,0.95)" }}>LearnAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" style={{ fontSize: "14px", fontWeight: 500 }}>Browse lessons</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" style={{ fontSize: "14px", fontWeight: 500 }}>Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" style={{ backgroundColor: "#0075de", color: "#ffffff", fontSize: "14px", fontWeight: 600, borderRadius: "4px" }}>Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — left-aligned, no gradient */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid md:grid-cols-[1fr_400px] gap-12 items-start">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#f2f9ff", color: "#097fe8", borderRadius: "9999px", padding: "4px 12px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.125px", marginBottom: "24px" }}>
              <Sparkles className="h-3 w-3" />
              AI-powered course marketplace
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-1.5px", color: "rgba(0,0,0,0.95)", marginBottom: "20px" }}>
              Teach what you know.<br />
              Learn what matters.
            </h1>
            <p style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.6, color: "#615d59", marginBottom: "32px", maxWidth: "480px" }}>
              Teachers publish lessons, AI summarizes the content, admins approve for quality — students subscribe and learn.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/sign-up">
                <Button style={{ backgroundColor: "#0075de", color: "#ffffff", fontWeight: 600, borderRadius: "4px", padding: "10px 20px" }}>
                  Start teaching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="ghost" style={{ fontWeight: 500, color: "rgba(0,0,0,0.7)" }}>
                  Browse the marketplace
                </Button>
              </Link>
            </div>
          </div>

          {/* How it works — right column */}
          <div style={{ backgroundColor: "#f6f5f4", borderRadius: "12px", padding: "28px", border: "1px solid rgba(0,0,0,0.08)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px", color: "#a39e98", textTransform: "uppercase", marginBottom: "16px" }}>How it works</p>
            {[
              { icon: BookOpen, label: "Teachers upload", desc: "Create lessons with rich content" },
              { icon: Sparkles, label: "AI summarizes", desc: "Instant learning-outcome summaries" },
              { icon: ShieldCheck, label: "Admins approve", desc: "Quality-checked before publishing" },
              { icon: Users, label: "Students subscribe", desc: "Access approved lessons instantly" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 mb-4 last:mb-0">
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon className="h-4 w-4" style={{ color: "#0075de" }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(0,0,0,0.9)", marginBottom: "2px" }}>{label}</p>
                  <p style={{ fontSize: "13px", color: "#615d59" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace preview */}
      <section style={{ backgroundColor: "#f6f5f4", padding: "64px 0" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(0,0,0,0.95)", marginBottom: "4px" }}>Available lessons</h2>
              <p style={{ fontSize: "15px", color: "#615d59" }}>Browse approved, AI-summarized courses from verified teachers</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" style={{ color: "#0075de", fontWeight: 600 }}>
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>

          {recentLessons.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)" }}>
              <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: "#a39e98" }} />
              <p style={{ fontSize: "15px", color: "#615d59" }}>No approved lessons yet. Be the first to teach!</p>
              <Link href="/sign-up"><Button size="sm" className="mt-4" style={{ backgroundColor: "#0075de", color: "white" }}>Create a lesson</Button></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentLessons.map((lesson) => (
                <div key={lesson.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "20px", boxShadow: "rgba(0,0,0,0.04) 0px 4px 18px" }}>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" style={{ fontSize: "11px", fontWeight: 600, borderRadius: "9999px" }}>{lesson.subject}</Badge>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0075de" }}>
                      {lesson.price === 0 ? "Free" : `$${(lesson.price / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "rgba(0,0,0,0.9)", marginBottom: "6px", letterSpacing: "-0.25px" }}>{lesson.title}</h3>
                  <p style={{ fontSize: "13px", color: "#615d59", lineHeight: 1.5, marginBottom: "12px" }}>{lesson.description.slice(0, 100)}{lesson.description.length > 100 ? "..." : ""}</p>
                  {lesson.aiSummary && (
                    <div style={{ backgroundColor: "#f2f9ff", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#097fe8", marginBottom: "4px" }}>AI Summary</p>
                      <p style={{ fontSize: "12px", color: "#615d59", lineHeight: 1.5 }}>{lesson.aiSummary.slice(0, 120)}...</p>
                    </div>
                  )}
                  <p style={{ fontSize: "12px", color: "#a39e98" }}>by {lesson.teacherName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comparison section — unconventional, breaks template */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(0,0,0,0.95)", marginBottom: "24px" }}>LearnAI vs. traditional platforms</h2>
        <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-0" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {["Feature", "LearnAI", "Others"].map((h, i) => (
            <div key={h} style={{ padding: "12px 16px", backgroundColor: "#f6f5f4", borderBottom: "1px solid rgba(0,0,0,0.1)", fontWeight: 600, fontSize: "13px", color: i === 1 ? "#0075de" : "rgba(0,0,0,0.7)", borderRight: i < 2 ? "1px solid rgba(0,0,0,0.1)" : "none" }}>{h}</div>
          ))}
          {[
            ["AI lesson summaries", "Automatic", "Manual or none"],
            ["Content moderation", "Admin-approved", "Self-published"],
            ["Teacher onboarding", "Instant upload", "Weeks of review"],
            ["Student subscriptions", "Per-lesson", "All-or-nothing"],
          ].map(([feat, ours, theirs]) => (
            <>
              <div key={feat + "f"} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: "14px", color: "rgba(0,0,0,0.8)", borderRight: "1px solid rgba(0,0,0,0.1)" }}>{feat}</div>
              <div key={feat + "o"} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: "14px", fontWeight: 500, color: "#0075de", borderRight: "1px solid rgba(0,0,0,0.1)" }}>{ours}</div>
              <div key={feat + "t"} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: "14px", color: "#a39e98" }}>{theirs}</div>
            </>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.1)", padding: "32px 0", backgroundColor: "#f6f5f4" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" style={{ color: "#0075de" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>LearnAI</span>
          </div>
          <p style={{ fontSize: "13px", color: "#a39e98" }}>AI-powered learning, human-approved quality</p>
        </div>
      </footer>
    </div>
  );
}
