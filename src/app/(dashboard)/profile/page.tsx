"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ProfileData {
  displayName: string;
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
  county: string;
  city: string;
}

const defaultProfile: ProfileData = {
  displayName: "", firstName: "", lastName: "", bio: "", email: "",
  county: "", city: "",
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileData>(defaultProfile);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.data?.user) {
      const p = data.data.user;
      setForm({
        displayName: p.displayName || "",
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        bio: p.bio || "",
        email: p.email || "",
        county: p.county || "",
        city: p.city || "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed to save");
      return d;
    },
    onSuccess: () => {
      toast.success("Profile saved!");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function update(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Creator Profile</h1>
        <p className="text-gray-500 mt-1">Set up your profile to start joining campaigns</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Your creator name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <textarea className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] focus:ring-offset-2" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell brands about yourself..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>County</Label>
              <Input value={form.county} onChange={(e) => update("county", e.target.value)} placeholder="e.g. Nairobi" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
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
