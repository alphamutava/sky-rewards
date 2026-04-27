"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 font-sans animate-fade">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-display text-white">
            Sky <span className="text-primary">Kenya</span>
          </Link>
          <h1 className="text-3xl font-display text-white mt-6">Join Sky Kenya</h1>
          <p className="text-muted mt-2">Choose how you want to use Sky Kenya</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition cursor-pointer group">
            <Link href="/register/creator">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-display text-white">I&apos;m a Creator</CardTitle>
                <CardDescription className="text-muted">Create content, earn money</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-2">
                <ul className="text-sm text-muted space-y-2 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">&#10003;</span>
                    Browse and join brand campaigns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">&#10003;</span>
                    Earn KES per 1,000 views
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">&#10003;</span>
                    Withdraw earnings via M-Pesa
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">&#10003;</span>
                    Join The 100 elite collective
                  </li>
                </ul>
                <Button className="w-full bg-transparent border border-border hover:bg-primary hover:border-primary hover:text-white text-white font-bold rounded-xl py-5 transition-all">
                  Sign Up as Creator <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-card border border-border rounded-3xl p-6 hover:border-white/30 transition cursor-pointer group">
            <Link href="/register/brand">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-display text-white">I&apos;m a Brand</CardTitle>
                <CardDescription className="text-muted">Launch campaigns, grow reach</CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-2">
                <ul className="text-sm text-muted space-y-2 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5">&#10003;</span>
                    Create content campaigns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5">&#10003;</span>
                    Access 2,500+ Kenyan creators
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5">&#10003;</span>
                    Pay only for verified views
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white mt-0.5">&#10003;</span>
                    Fund via M-Pesa
                  </li>
                </ul>
                <Button className="w-full bg-transparent border border-border hover:bg-white hover:text-[#0a0a0a] text-white font-bold rounded-xl py-5 transition-all">
                  Sign Up as Brand <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <p className="text-center text-sm text-muted mt-8 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primaryHover transition-colors font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
