"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Search, Sparkles, GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Lesson = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  status: string;
  aiSummary: string | null;
  teacherName: string | null;
  createdAt: string;
};

export default function MarketplacePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "approved" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/canary-lessons?${params}`);
      const data = await res.json();
      if (data.ok) setLessons(data.lessons);
    } catch {
      toast.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchLessons, 300);
    return () => clearTimeout(t);
  }, [fetchLessons]);

  const subscribe = async (lessonId: string) => {
    setSubscribing(lessonId);
    try {
      const res = await fetch("/api/canary-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Subscribed successfully!");
      } else {
        toast.error(data.error || "Subscription failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      <nav style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" style={{ color: "#0075de" }} />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "rgba(0,0,0,0.95)" }}>LearnAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/app"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Link href="/sign-in"><Button size="sm" style={{ backgroundColor: "#0075de", color: "white", borderRadius: "4px" }}>Sign in</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: "#615d59" }}>
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-1px", color: "rgba(0,0,0,0.95)", marginBottom: "6px" }}>Lesson marketplace</h1>
          <p style={{ fontSize: "15px", color: "#615d59" }}>Browse AI-summarized, admin-approved lessons from expert teachers</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-8" style={{ maxWidth: "480px" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#a39e98" }} />
            <Input
              placeholder="Search lessons, subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ borderColor: "rgba(0,0,0,0.15)", fontSize: "14px" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "20px" }}>
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px", backgroundColor: "#f6f5f4", borderRadius: "12px" }}>
            <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: "#a39e98" }} />
            <p style={{ fontSize: "16px", fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>No lessons found</p>
            <p style={{ fontSize: "14px", color: "#a39e98", marginTop: "4px" }}>Try adjusting your search or check back later</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "20px", boxShadow: "rgba(0,0,0,0.04) 0px 4px 18px" }}>
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" style={{ fontSize: "11px", fontWeight: 600, borderRadius: "9999px" }}>{lesson.subject}</Badge>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#0075de" }}>
                    {lesson.price === 0 ? "Free" : `$${(lesson.price / 100).toFixed(2)}`}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "rgba(0,0,0,0.9)", marginBottom: "6px", letterSpacing: "-0.25px" }}>{lesson.title}</h3>
                <p style={{ fontSize: "13px", color: "#615d59", lineHeight: 1.5, marginBottom: "12px" }}>
                  {lesson.description.slice(0, 120)}{lesson.description.length > 120 ? "..." : ""}
                </p>
                {lesson.aiSummary && (
                  <div style={{ backgroundColor: "#f2f9ff", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="h-3 w-3" style={{ color: "#097fe8" }} />
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#097fe8" }}>AI Summary</p>
                    </div>
                    <p style={{ fontSize: "12px", color: "#615d59", lineHeight: 1.5 }}>{lesson.aiSummary}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <p style={{ fontSize: "12px", color: "#a39e98" }}>by {lesson.teacherName}</p>
                  <Button
                    size="sm"
                    onClick={() => subscribe(lesson.id)}
                    disabled={subscribing === lesson.id}
                    style={{ backgroundColor: "#0075de", color: "white", borderRadius: "4px", fontSize: "13px" }}
                  >
                    {subscribing === lesson.id ? "Joining..." : "Subscribe"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
