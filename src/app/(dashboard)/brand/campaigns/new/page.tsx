"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CampaignForm {
  title: string;
  description: string;
  brief: string;
  type: "VIDEO" | "PHOTO" | "ARTICLE" | "MIXED";
  totalBudget: string;
  rewardPerView: string;
  creatorReward: string;
  maxSubmissions: string;
  maxViewsPerSubmission: string;
  startDate: string;
  endDate: string;
  tags: string[];
  guidelines: string;
  targetCounty: string;
  coverImage: string;
}

const defaultForm: CampaignForm = {
  title: "", description: "", brief: "", type: "VIDEO",
  totalBudget: "", rewardPerView: "0.5", creatorReward: "500",
  maxSubmissions: "50", maxViewsPerSubmission: "10000",
  startDate: "", endDate: "", tags: [], guidelines: "",
  targetCounty: "", coverImage: "",
};

const typeOptions: { value: CampaignForm["type"]; label: string }[] = [
  { value: "VIDEO", label: "Video" },
  { value: "PHOTO", label: "Photo" },
  { value: "ARTICLE", label: "Article" },
  { value: "MIXED", label: "Mixed" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState<CampaignForm>(defaultForm);
  const [tagInput, setTagInput] = useState("");

  function update<K extends keyof CampaignForm>(field: K, value: CampaignForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || form.tags.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setTagInput("");
  }

  function removeTag(index: number) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description,
        brief: form.brief,
        type: form.type,
        totalBudget: parseFloat(form.totalBudget),
        rewardPerView: parseFloat(form.rewardPerView),
        creatorReward: parseFloat(form.creatorReward),
        maxSubmissions: parseInt(form.maxSubmissions),
        maxViewsPerSubmission: parseInt(form.maxViewsPerSubmission),
        startDate: form.startDate,
        endDate: form.endDate,
        tags: form.tags,
        guidelines: form.guidelines || undefined,
        targetCounty: form.targetCounty || undefined,
        coverImage: form.coverImage || undefined,
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create campaign");
      return data;
    },
    onSuccess: (data) => {
      toast.success("Campaign created! Fund it to make it live.");
      router.push(`/brand/campaigns/${data.data?.id || ""}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/brand/campaigns">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Create New Campaign</h1>
          <p className="text-gray-500 mt-1">Set up your content campaign for Kenyan creators</p>
        </div>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. M-Pesa Go Global Challenge" />
          </div>
          <div className="space-y-2">
            <Label>Description * (min 20 chars)</Label>
            <textarea className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] focus:ring-offset-2" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short campaign description shown in discovery..." />
          </div>
          <div className="space-y-2">
            <Label>Brief * (min 50 chars)</Label>
            <textarea className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] focus:ring-offset-2" value={form.brief} onChange={(e) => update("brief", e.target.value)} placeholder="Detailed brief for creators: what to create, requirements, style guide..." />
          </div>
          <div className="space-y-2">
            <Label>Guidelines (optional)</Label>
            <textarea className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] focus:ring-offset-2" value={form.guidelines} onChange={(e) => update("guidelines", e.target.value)} placeholder="Additional guidelines for content creators..." />
          </div>
          <div className="space-y-2">
            <Label>Campaign Type *</Label>
            <div className="flex gap-3">
              {typeOptions.map((t) => (
                <button key={t.value} type="button" onClick={() => update("type", t.value)}
                  className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                    form.type === t.value ? "bg-[#0D1B2A] text-white border-[#0D1B2A]" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} />
            <Button type="button" variant="outline" size="sm" onClick={() => addTag(tagInput)}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="gap-1">{tag}<button type="button" onClick={() => removeTag(i)}><X className="w-3 h-3" /></button></Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget & Rewards */}
      <Card>
        <CardHeader><CardTitle>Budget & Rewards</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total Budget (KES) * (min 5,000)</Label>
              <Input type="number" value={form.totalBudget} onChange={(e) => update("totalBudget", e.target.value)} placeholder="e.g. 100000" />
            </div>
            <div className="space-y-2">
              <Label>Reward per View (KES) *</Label>
              <Input type="number" step="0.1" value={form.rewardPerView} onChange={(e) => update("rewardPerView", e.target.value)} placeholder="e.g. 0.5" />
            </div>
            <div className="space-y-2">
              <Label>Creator Reward (KES) *</Label>
              <Input type="number" value={form.creatorReward} onChange={(e) => update("creatorReward", e.target.value)} placeholder="e.g. 500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits & Dates */}
      <Card>
        <CardHeader><CardTitle>Limits & Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Submissions</Label>
              <Input type="number" value={form.maxSubmissions} onChange={(e) => update("maxSubmissions", e.target.value)} placeholder="50" />
            </div>
            <div className="space-y-2">
              <Label>Max Views per Submission</Label>
              <Input type="number" value={form.maxViewsPerSubmission} onChange={(e) => update("maxViewsPerSubmission", e.target.value)} placeholder="10000" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target County (optional)</Label>
              <Input value={form.targetCounty} onChange={(e) => update("targetCounty", e.target.value)} placeholder="e.g. Nairobi" />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL (optional)</Label>
              <Input value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button size="lg" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create Campaign
        </Button>
        <Link href="/brand/campaigns">
          <Button variant="outline" size="lg">Cancel</Button>
        </Link>
      </div>
    </div>
  );
}
