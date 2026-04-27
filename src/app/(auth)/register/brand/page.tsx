"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterBrandPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: "BRAND",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || data.message || "Registration failed");
        return;
      }
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 font-sans animate-fade">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-display text-white">
            Sky <span className="text-primary">Kenya</span>
          </Link>
        </div>
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display mb-2 text-white">Create Brand Account</h1>
            <p className="text-muted text-sm font-medium">Launch campaigns and reach millions</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold text-muted uppercase tracking-[1.5px]">Business Email</Label>
              <Input id="email" type="email" placeholder="you@company.co.ke" value={form.email} onChange={(e) => update("email", e.target.value)} required
                className="w-full bg-[#050505] border-border rounded-xl px-4 py-6 text-white text-[15px] outline-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-bold text-muted uppercase tracking-[1.5px]">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 chars, uppercase, number, special" value={form.password} onChange={(e) => update("password", e.target.value)} required
                  className="w-full bg-[#050505] border-border rounded-xl px-4 py-6 text-white text-[15px] outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[11px] font-bold text-muted uppercase tracking-[1.5px]">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required
                className="w-full bg-[#050505] border-border rounded-xl px-4 py-6 text-white text-[15px] outline-none" />
            </div>
            <Button type="submit" className="w-full bg-white hover:bg-gray-100 text-[#0a0a0a] font-bold rounded-xl py-6 text-lg transition-all mt-4" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create Brand Account
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-muted font-medium">
            Already have an account? <Link href="/login" className="text-primary hover:text-primaryHover transition-colors font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
