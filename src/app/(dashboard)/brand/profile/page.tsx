"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface BrandForm {
  companyName: string;
  description: string;
  website: string;
  industry: string;
  phoneNumber: string;
  contactPersonName: string;
  contactPersonEmail: string;
  county: string;
  physicalAddress: string;
}

const defaultForm: BrandForm = {
  companyName: "", description: "", website: "", industry: "",
  phoneNumber: "", contactPersonName: "", contactPersonEmail: "",
  county: "", physicalAddress: "",
};

export default function BrandProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BrandForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ["brand-profile"],
    queryFn: async () => {
      const res = await fetch("/api/brands/me");
      if (res.status === 404) return { profile: null };
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        companyName: p.companyName || "", description: p.description || "",
        website: p.website || "", industry: p.industry || "",
        phoneNumber: p.phoneNumber || "", contactPersonName: p.contactPersonName || "",
        contactPersonEmail: p.contactPersonEmail || "", county: p.county || "",
        physicalAddress: p.physicalAddress || "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/brands/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed to save");
      return d;
    },
    onSuccess: () => {
      toast.success("Brand profile saved!");
      queryClient.invalidateQueries({ queryKey: ["brand-profile"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function update(field: keyof BrandForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Brand Profile</h1>
        <p className="text-gray-500 mt-1">Set up your company profile</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Industry *</Label>
              <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="e.g. FMCG, Fintech, Fashion" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] focus:ring-offset-2" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="About your company..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={form.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} placeholder="254XXXXXXXXX" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={form.contactPersonName} onChange={(e) => update("contactPersonName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contactPersonEmail} onChange={(e) => update("contactPersonEmail", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>County</Label>
              <Input value={form.county} onChange={(e) => update("county", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Physical Address</Label>
              <Input value={form.physicalAddress} onChange={(e) => update("physicalAddress", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Profile
      </Button>
    </div>
  );
}
