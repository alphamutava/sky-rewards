"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/utils";
import { Loader2, Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function EarningsPage() {
  const [page, setPage] = useState(1);

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const r = await fetch("/api/wallet"); return r.ok ? r.json() : null; },
  });

  const { data: txData, isLoading } = useQuery({
    queryKey: ["earnings-tx", page],
    queryFn: async () => {
      const r = await fetch(`/api/wallet/transactions?page=${page}&limit=20&type=CREATOR_PAYOUT`);
      return r.ok ? r.json() : null;
    },
  });

  const wallet = walletData?.data?.wallet;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your content earnings</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-5">
            <TrendingUp className="w-5 h-5 text-gray-300 mb-2" />
            <div className="text-3xl font-bold tabular-nums">{formatKES(Number(wallet?.totalEarned || 0))}</div>
            <p className="text-sm text-gray-300 mt-1">Total Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Wallet className="w-5 h-5 text-[#2D6A4F] mb-2" />
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.balance || 0))}</div>
            <p className="text-sm text-gray-500 mt-1">Available Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <ArrowUpRight className="w-5 h-5 text-[#E63946] mb-2" />
            <div className="text-2xl font-bold tabular-nums">{formatKES(Number(wallet?.totalWithdrawn || 0))}</div>
            <p className="text-sm text-gray-500 mt-1">Total Withdrawn</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Earning History</CardTitle>
          <Link href="/wallet"><Button variant="outline" size="sm">View All Transactions</Button></Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : !txData?.data?.length ? (
            <p className="text-center text-gray-400 py-8">No earnings yet. Join campaigns and start creating!</p>
          ) : (
            <div className="space-y-3">
              {txData.data.map((tx: { id: string; transactionDesc: string; amount: number; fee: number; netAmount: number; createdAt: string; status: string }) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.transactionDesc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      {Number(tx.fee) > 0 && ` · Fee: ${formatKES(Number(tx.fee))}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#2D6A4F] tabular-nums">+{formatKES(Number(tx.netAmount))}</p>
                    <Badge variant="success" className="text-[10px] mt-1">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {txData?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <span className="text-sm text-gray-500">{page}/{txData.pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= txData.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
