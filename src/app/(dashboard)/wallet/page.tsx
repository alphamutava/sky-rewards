"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKES } from "@/lib/utils";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, ArrowDownLeft, Loader2, Phone } from "lucide-react";

async function fetchWallet() {
  const res = await fetch("/api/wallet");
  if (!res.ok) throw new Error("Failed to fetch wallet");
  return res.json();
}

async function fetchTransactions(page: number) {
  const res = await fetch(`/api/wallet/transactions?page=${page}&limit=10`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

const statusColors: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  COMPLETED: "success",
  FAILED: "destructive",
  PENDING: "warning",
  PROCESSING: "warning",
  REVERSED: "secondary",
  CANCELLED: "secondary",
};

const typeLabels: Record<string, string> = {
  DEPOSIT: "M-Pesa Deposit",
  WITHDRAWAL: "M-Pesa Withdrawal",
  CAMPAIGN_FUND: "Campaign Fund",
  CREATOR_PAYOUT: "Creator Payout",
  VIEW_REWARD: "View Reward",
  PLATFORM_COMMISSION: "Commission",
  ELITE_BONUS: "Elite Bonus",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [txPage, setTxPage] = useState(1);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhone, setDepositPhone] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", txPage],
    queryFn: () => fetchTransactions(txPage),
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(depositAmount);
      if (isNaN(amt) || amt < 1000) {
        throw new Error("Minimum deposit is KES 1,000");
      }
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, phoneNumber: depositPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Deposit failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || "Deposit initiated successfully");
      setDepositAmount("");
      setDepositPhone("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(withdrawAmount);
      if (isNaN(amt) || amt < 100) {
        throw new Error("Minimum withdrawal is KES 100");
      }
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, phoneNumber: withdrawPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Withdrawal failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || "Withdrawal initiated successfully");
      setWithdrawAmount("");
      setWithdrawPhone("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const wallet = walletData?.data?.wallet;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">Wallet</h1>

      {/* Balance Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
              <Wallet className="w-4 h-4" /> Available Balance
            </div>
            <div className="text-3xl font-bold tabular-nums">{formatKES(Number(wallet?.balance || 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
              <ArrowDownLeft className="w-4 h-4 text-[#2D6A4F]" /> Total Deposited
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.totalEarned || 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
              <ArrowUpRight className="w-4 h-4 text-[#E63946]" /> Total Withdrawn
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.totalWithdrawn || 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit & Withdraw */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2D6A4F]">
              <ArrowDownLeft className="w-5 h-5" /> Deposit via M-Pesa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input type="number" placeholder="Min 1,000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-10" placeholder="254XXXXXXXXX" value={depositPhone} onChange={(e) => setDepositPhone(e.target.value)} />
              </div>
            </div>
            <Button
              className="w-full bg-[#2D6A4F] hover:bg-green-700"
              disabled={depositMutation.isPending || !depositAmount || !depositPhone}
              onClick={() => depositMutation.mutate()}
            >
              {depositMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Deposit {depositAmount ? formatKES(parseInt(depositAmount)) : ""}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#E63946]">
              <ArrowUpRight className="w-5 h-5" /> Withdraw to M-Pesa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input type="number" placeholder="Min 500" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-10" placeholder="254XXXXXXXXX" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} />
              </div>
            </div>
            <Button
              className="w-full bg-[#E63946] hover:bg-red-600"
              disabled={withdrawMutation.isPending || !withdrawAmount || !withdrawPhone}
              onClick={() => withdrawMutation.mutate()}
            >
              {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Withdraw {withdrawAmount ? formatKES(parseInt(withdrawAmount)) : ""}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : txData?.data?.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {txData?.data?.map((tx: {
                id: string; type: string; status: string;
                amount: number; netAmount: number;
                transactionDesc: string; createdAt: string; referenceCode: string;
              }) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ["DEPOSIT", "CREATOR_PAYOUT", "VIEW_REWARD", "REFUND", "ELITE_BONUS"].includes(tx.type)
                        ? "bg-green-50 text-[#2D6A4F]" : "bg-red-50 text-[#E63946]"
                    }`}>
                      {["DEPOSIT", "CREATOR_PAYOUT", "VIEW_REWARD", "REFUND", "ELITE_BONUS"].includes(tx.type)
                        ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{typeLabels[tx.type] || tx.type}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${
                      ["DEPOSIT", "CREATOR_PAYOUT", "VIEW_REWARD", "REFUND", "ELITE_BONUS"].includes(tx.type)
                        ? "text-[#2D6A4F]" : "text-[#E63946]"
                    }`}>
                      {["DEPOSIT", "CREATOR_PAYOUT", "VIEW_REWARD", "REFUND", "ELITE_BONUS"].includes(tx.type) ? "+" : "-"}{formatKES(Number(tx.amount))}
                    </p>
                    <Badge variant={statusColors[tx.status] || "secondary"} className="text-[10px] mt-1">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {txData?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={txPage <= 1} onClick={() => setTxPage(txPage - 1)}>Prev</Button>
              <span className="text-sm text-gray-500">{txPage} / {txData.pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={txPage >= txData.pagination.totalPages} onClick={() => setTxPage(txPage + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
