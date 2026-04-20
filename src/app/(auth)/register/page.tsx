"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#0D1B2A]">
            Sky <span className="text-[#E63946]">Kenya</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#0D1B2A] mt-6">Join Sky Kenya</h1>
          <p className="text-gray-500 mt-2">Choose how you want to use Sky Kenya</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition cursor-pointer group">
            <Link href="/register/creator">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-[#E63946]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#E63946]/20 transition">
                  <Users className="w-8 h-8 text-[#E63946]" />
                </div>
                <CardTitle className="text-xl">I&apos;m a Creator</CardTitle>
                <CardDescription>Create content, earn money</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-500 space-y-2 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Browse and join brand campaigns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Earn KES per 1,000 views
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Withdraw earnings via M-Pesa
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Join The 100 elite collective
                  </li>
                </ul>
                <Button className="w-full group-hover:bg-[#E63946]" variant="outline">
                  Sign Up as Creator <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition cursor-pointer group">
            <Link href="/register/brand">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-[#0D1B2A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0D1B2A]/20 transition">
                  <Building2 className="w-8 h-8 text-[#0D1B2A]" />
                </div>
                <CardTitle className="text-xl">I&apos;m a Brand</CardTitle>
                <CardDescription>Launch campaigns, grow reach</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-500 space-y-2 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Create content campaigns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Access 2,500+ Kenyan creators
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Pay only for verified views
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2D6A4F] mt-0.5">&#10003;</span>
                    Fund via M-Pesa
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Sign Up as Brand <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E63946] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
