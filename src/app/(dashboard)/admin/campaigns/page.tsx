"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatKES, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Loader2, Search, Eye, Users } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "default"> = {
  DRAFT: "secondary", PENDING_REVIEW: "warning", ACTIVE: "success",
  PAUSED: "warning", COMPLETED: "default", CANCELLED: "destructive",
};

export default function AdminCampaignsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-campaigns", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: "20", search });
      const res = await fetch(`/api/campaigns?${params}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">All Campaigns</h1>
        <p className="text-gray-500 mt-1">Review and manage platform campaigns</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-10" placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((c: {
            id: string; title: string; status: string; type: string;
            totalBudgetKes: number; rewardPerMilleKes: number;
            totalCreatorsJoined: number; totalViewsGenerated: string;
            brand: { companyName: string }; createdAt: string;
            _count: { submissions: number };
          }) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <Card className="hover:shadow-sm transition">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusVariant[c.status] || "secondary"} className="text-xs">{c.status.replace("_", " ")}</Badge>
                      <Badge variant="outline" className="text-xs">{c.type}</Badge>
                    </div>
                    <h3 className="font-semibold text-[#0D1B2A]">{c.title}</h3>
                    <p className="text-xs text-gray-400">{c.brand.companyName} &middot; {new Date(c.createdAt).toLocaleDateString("en-KE")}</p>
                  </div>
                  <div className="flex items-center gap-5 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Budget</div>
                      <div className="font-semibold tabular-nums">{formatKES(c.totalBudgetKes)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Creators</div>
                      <div className="font-semibold flex items-center gap-1"><Users className="w-3 h-3" />{c.totalCreatorsJoined}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Views</div>
                      <div className="font-semibold flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(Number(c.totalViewsGenerated || 0))}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="text-sm text-gray-500">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
