"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Check, X, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Lesson = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  status: string;
  aiSummary: string | null;
  reviewNote: string | null;
  teacherName: string | null;
  createdAt: string;
};

type Stats = {
  totalLessons: number;
  pendingLessons: number;
  approvedLessons: number;
  totalSubscriptions: number;
  totalUsers: number;
};

export default function AdminPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"pending" | "all">("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsRes, statsRes] = await Promise.all([
        fetch(`/api/canary-lessons?status=${activeFilter}`),
        fetch("/api/canary-admin/stats"),
      ]);
      const [lessonsData, statsData] = await Promise.all([lessonsRes.json(), statsRes.json()]);
      if (lessonsData.ok) setLessons(lessonsData.lessons);
      if (statsData.ok) setStats(statsData.stats);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeFilter]);

  const handleAction = async (lessonId: string, action: "approve" | "reject") => {
    setActioning(lessonId + action);
    try {
      const res = await fetch(`/api/canary-lessons/${lessonId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: reviewNotes[lessonId] || "" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Lesson ${action === "approve" ? "approved" : "rejected"} successfully`);
        fetchData();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f6f5f4", fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" style={{ color: "#0075de" }} />
            <span style={{ fontSize: "15px", fontWeight: 600 }}>LearnAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/app"><Button variant="ghost" size="sm" style={{ fontSize: "13px" }}>Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-5 w-5" style={{ color: "#0075de" }} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(0,0,0,0.95)" }}>Admin panel</h1>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {[
              { label: "Total lessons", value: stats.totalLessons },
              { label: "Pending review", value: stats.pendingLessons, highlight: stats.pendingLessons > 0 },
              { label: "Approved", value: stats.approvedLessons },
              { label: "Subscriptions", value: stats.totalSubscriptions },
              { label: "Users", value: stats.totalUsers },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: `1px solid ${highlight ? "#dd5b00" : "rgba(0,0,0,0.1)"}`, padding: "16px" }}>
                <p style={{ fontSize: "24px", fontWeight: 700, color: highlight ? "#dd5b00" : "rgba(0,0,0,0.9)", letterSpacing: "-0.5px" }}>{value}</p>
                <p style={{ fontSize: "12px", color: "#615d59", marginTop: "2px" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid",
                cursor: "pointer",
                backgroundColor: activeFilter === f ? "#0075de" : "#ffffff",
                borderColor: activeFilter === f ? "#0075de" : "rgba(0,0,0,0.15)",
                color: activeFilter === f ? "#ffffff" : "rgba(0,0,0,0.7)",
              }}
            >
              {f === "pending" ? "Pending review" : "All lessons"}
            </button>
          ))}
        </div>

        {/* Lesson review queue */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#a39e98" }} />
          </div>
        ) : lessons.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)" }}>
            <Check className="h-8 w-8 mx-auto mb-2" style={{ color: "#1aae39" }} />
            <p style={{ fontSize: "15px", color: "#615d59" }}>No lessons to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "20px" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "rgba(0,0,0,0.9)" }}>{lesson.title}</h3>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: lesson.status === "approved" ? "#1aae39" : lesson.status === "rejected" ? "#dc2626" : "#dd5b00", backgroundColor: lesson.status === "approved" ? "#1aae3915" : lesson.status === "rejected" ? "#dc262615" : "#dd5b0015", borderRadius: "9999px", padding: "2px 8px" }}>{lesson.status}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#615d59" }}>{lesson.subject} · by {lesson.teacherName} · {lesson.price === 0 ? "Free" : `$${(lesson.price / 100).toFixed(2)}`}</p>
                  </div>
                </div>

                <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.75)", lineHeight: 1.5, marginBottom: "12px" }}>{lesson.description}</p>

                {lesson.aiSummary && (
                  <div style={{ backgroundColor: "#f2f9ff", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#097fe8", marginBottom: "4px" }}>AI Summary</p>
                    <p style={{ fontSize: "13px", color: "#615d59" }}>{lesson.aiSummary}</p>
                  </div>
                )}

                {lesson.status === "pending" && (
                  <div className="mt-3">
                    <Label htmlFor={`note-${lesson.id}`} style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>Review note (optional)</Label>
                    <Textarea
                      id={`note-${lesson.id}`}
                      placeholder="Add a note for the teacher..."
                      value={reviewNotes[lesson.id] || ""}
                      onChange={(e) => setReviewNotes((prev) => ({ ...prev, [lesson.id]: e.target.value }))}
                      rows={2}
                      className="mt-1 mb-3"
                      style={{ fontSize: "13px", borderColor: "rgba(0,0,0,0.15)" }}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(lesson.id, "approve")}
                        disabled={actioning === lesson.id + "approve"}
                        style={{ backgroundColor: "#1aae39", color: "white", borderRadius: "4px", fontSize: "13px" }}
                      >
                        {actioning === lesson.id + "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(lesson.id, "reject")}
                        disabled={actioning === lesson.id + "reject"}
                        style={{ borderRadius: "4px", fontSize: "13px" }}
                      >
                        {actioning === lesson.id + "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
