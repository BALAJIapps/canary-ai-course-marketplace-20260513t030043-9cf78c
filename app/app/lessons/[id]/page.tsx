"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Lesson = {
  id: string;
  title: string;
  description: string;
  content: string;
  subject: string;
  price: number;
  status: string;
  aiSummary: string | null;
  teacherName: string | null;
};

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    fetch(`/api/canary-lessons?status=all`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          const found = d.lessons.find((l: Lesson) => l.id === id);
          setLesson(found || null);
        }
      })
      .catch(() => toast.error("Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [id]);

  const generateSummary = async () => {
    if (!lesson) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/canary-ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setLesson((prev) => prev ? { ...prev, aiSummary: data.summary } : prev);
        toast.success("AI summary generated!");
      } else {
        toast.error(data.error || "Failed to generate summary");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f6f5f4" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#a39e98" }} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f6f5f4" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#615d59" }}>Lesson not found</p>
          <Link href="/app"><Button size="sm" className="mt-3">Back to dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f6f5f4", fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" style={{ color: "#0075de" }} />
            <span style={{ fontSize: "15px", fontWeight: 600 }}>LearnAI</span>
          </Link>
          <Link href="/app"><Button variant="ghost" size="sm">Dashboard</Button></Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "#615d59" }}>
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "32px" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" style={{ borderRadius: "9999px", fontSize: "11px" }}>{lesson.subject}</Badge>
              <span style={{
                fontSize: "11px", fontWeight: 600,
                color: lesson.status === "approved" ? "#1aae39" : lesson.status === "rejected" ? "#dc2626" : "#dd5b00",
                backgroundColor: lesson.status === "approved" ? "#1aae3915" : lesson.status === "rejected" ? "#dc262615" : "#dd5b0015",
                borderRadius: "9999px", padding: "2px 8px"
              }}>{lesson.status}</span>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0075de" }}>
              {lesson.price === 0 ? "Free" : `$${(lesson.price / 100).toFixed(2)}`}
            </span>
          </div>

          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(0,0,0,0.95)", marginBottom: "8px" }}>{lesson.title}</h1>
          <p style={{ fontSize: "14px", color: "#615d59", marginBottom: "24px" }}>{lesson.description}</p>

          {/* AI Summary */}
          <div style={{ backgroundColor: "#f6f5f4", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" style={{ color: "#097fe8" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#097fe8" }}>AI Summary</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={generateSummary}
                disabled={summarizing}
                style={{ fontSize: "12px", color: "#0075de" }}
              >
                {summarizing
                  ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Generating...</>
                  : lesson.aiSummary ? "Regenerate" : "Generate summary"}
              </Button>
            </div>
            {lesson.aiSummary ? (
              <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.8)", lineHeight: 1.6 }}>{lesson.aiSummary}</p>
            ) : (
              <p style={{ fontSize: "13px", color: "#a39e98", fontStyle: "italic" }}>No summary yet. Click "Generate summary" to create one with AI.</p>
            )}
          </div>

          {/* Content */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.6)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Lesson content</p>
            <div style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(0,0,0,0.85)", whiteSpace: "pre-wrap" }}>{lesson.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
