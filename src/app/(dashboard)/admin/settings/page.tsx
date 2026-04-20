"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Shield, Wallet } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure Sky Kenya platform settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Financial Settings</CardTitle>
          <CardDescription>Commission rates and transaction limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Commission Rate (%)</Label>
              <Input type="number" defaultValue="15" disabled />
            </div>
            <div className="space-y-2">
              <Label>Min Deposit (KES)</Label>
              <Input type="number" defaultValue="1000" disabled />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Withdrawal (KES)</Label>
              <Input type="number" defaultValue="500" disabled />
            </div>
            <div className="space-y-2">
              <Label>Max Withdrawal (KES)</Label>
              <Input type="number" defaultValue="150000" disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Daily Withdrawal Limit (KES)</Label>
            <Input type="number" defaultValue="300000" disabled />
          </div>
          <p className="text-xs text-gray-400">Settings are currently read-only. Contact the dev team to change them.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Security</CardTitle>
          <CardDescription>Cron job endpoints and API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Auto-Approve Cron</Label>
            <Input value="/api/cron/auto-approve" disabled />
          </div>
          <div className="space-y-2">
            <Label>Verify & Pay Cron</Label>
            <Input value="/api/cron/verify-and-pay" disabled />
          </div>
          <p className="text-xs text-gray-400">Cron jobs should be configured with a CRON_SECRET header for authentication.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> The 100 Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Revenue Target (KES)</Label>
            <Input type="number" defaultValue="100000000" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
