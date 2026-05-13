"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function NewLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    subject: "general",
    price: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.content) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/canary-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Math.round(parseFloat(form.price) * 100),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Lesson submitted for review!");
        router.push("/app");
      } else {
        toast.error(data.error || "Failed to create lesson");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

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
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </Link>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", padding: "32px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.25px", color: "rgba(0,0,0,0.95)", marginBottom: "6px" }}>Create a new lesson</h1>
          <p style={{ fontSize: "14px", color: "#615d59", marginBottom: "28px" }}>Your lesson will be reviewed by an admin before publishing. AI will auto-summarize your content.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.8)" }}>Lesson title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to Python Data Structures"
                className="mt-1"
                style={{ borderColor: "rgba(0,0,0,0.15)", fontSize: "14px" }}
                required
              />
            </div>

            <div>
              <Label htmlFor="subject" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.8)" }}>Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Programming, Mathematics, Design"
                className="mt-1"
                style={{ borderColor: "rgba(0,0,0,0.15)", fontSize: "14px" }}
              />
            </div>

            <div>
              <Label htmlFor="description" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.8)" }}>Short description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What will students learn in this lesson?"
                className="mt-1"
                rows={3}
                style={{ borderColor: "rgba(0,0,0,0.15)", fontSize: "14px" }}
                required
              />
            </div>

            <div>
              <Label htmlFor="content" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.8)" }}>Lesson content *</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your full lesson content here..."
                className="mt-1"
                rows={10}
                style={{ borderColor: "rgba(0,0,0,0.15)", fontSize: "14px" }}
                required
              />
            </div>

            <div>
              <Label htmlFor="price" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.8)" }}>Price (USD, 0 for free)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1"
                style={{ borderColor: "rgba(0,0,0,0.15)", fontSize: "14px", maxWidth: "160px" }}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#0075de", color: "white", fontWeight: 600, borderRadius: "4px", padding: "10px 24px" }}
            >
              {loading ? "Submitting..." : "Submit for review"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
