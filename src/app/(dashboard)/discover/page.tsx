"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { formatKES } from "@/lib/utils";
import { Search, Users, Eye, Star, Loader2, Filter } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  tags: string[];
  rewardPerView: number;
  creatorReward: number;
  totalBudget: number;
  remainingBudget: number;
  startDate: string;
  endDate: string;
  maxSubmissions: number;
  totalSubmissions: number;
  coverImage: string | null;
  advertiser: { id: string; displayName: string | null; avatar: string | null };
  _count: { submissions: number };
}

async function fetchCampaigns(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/campaigns?${query}`);
  return res.json();
}

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", search, type, sort, page],
    queryFn: () =>
      fetchCampaigns({
        search,
        ...(type !== "all" ? { type } : {}),
        sort,
        page: page.toString(),
        limit: "12",
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Discover Campaigns</h1>
        <p className="text-gray-500 mt-1">Find campaigns that match your niche and start earning</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="PHOTO">Photo</SelectItem>
            <SelectItem value="ARTICLE">Article</SelectItem>
            <SelectItem value="MIXED">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest_reward">Highest Reward</SelectItem>
            <SelectItem value="ending_soon">Ending Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : data?.data?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No campaigns found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((c: Campaign) => (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <Card className="hover:shadow-lg transition h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                          {(c.advertiser?.displayName || "??").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{c.advertiser?.displayName || "Brand"}</p>
                          <p className="text-xs text-gray-400">{c.type}</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold text-[#0D1B2A] mb-1 line-clamp-2">{c.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{c.description}</p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="default" className="text-[10px]">
                        {c.type}
                      </Badge>
                      {c.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3 mt-auto">
                      <div className="text-[#2D6A4F] font-bold tabular-nums">
                        {formatKES(Number(c.rewardPerView))}<span className="text-xs font-normal text-gray-400">/view</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c._count?.submissions || 0}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.totalSubmissions}/{c.maxSubmissions}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">Page {page} of {data.pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
