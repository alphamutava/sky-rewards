"use client";

import { useState, useDeferredValue } from "react";
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
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", deferredSearch, type, sort, page],
    queryFn: () =>
      fetchCampaigns({
        search: deferredSearch,
        ...(type !== "all" ? { type } : {}),
        sort,
        page: page.toString(),
        limit: "12",
      }),
  });

  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h1 className="text-5xl font-display text-white mb-2 tracking-wide uppercase">Discover Campaigns</h1>
        <p className="text-muted text-lg font-medium">Browse live brand campaigns paying per view.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <Input
            placeholder="Search campaigns..."
            className="pl-12 bg-card border-border text-white rounded-xl py-6 outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-card border-border text-white rounded-xl py-6">
            <Filter className="w-4 h-4 mr-2 text-muted" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-white rounded-xl">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="PHOTO">Photo</SelectItem>
            <SelectItem value="ARTICLE">Article</SelectItem>
            <SelectItem value="MIXED">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-44 bg-card border-border text-white rounded-xl py-6">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-white rounded-xl">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest_reward">Highest Reward</SelectItem>
            <SelectItem value="ending_soon">Ending Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.data?.length === 0 ? (
        <Card className="bg-card border-border rounded-3xl">
          <CardContent className="py-20 text-center">
            <Search className="w-12 h-12 text-border2 mx-auto mb-4" />
            <p className="text-muted text-lg font-medium">No campaigns found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((c: Campaign) => {
              let parsedTags: string[] = [];
              try { parsedTags = typeof c.tags === 'string' ? JSON.parse(c.tags) : c.tags; } catch(e) {}
              
              return (
                <Link key={c.id} href={`/campaigns/${c.id}`}>
                  <Card className="bg-card border-border hover:border-primary hover:-translate-y-1 transition-all duration-300 rounded-3xl h-full flex flex-col group overflow-hidden shadow-xl">
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-black border border-border2 rounded-xl flex items-center justify-center text-xl font-display text-white">
                            {(c.advertiser?.displayName || "??").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{c.advertiser?.displayName || "Brand"}</p>
                            <p className="text-xs text-muted font-bold tracking-wider uppercase mt-1">{c.type}</p>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-xl font-display text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{c.title}</h3>
                      <p className="text-sm text-muted font-medium line-clamp-2 mb-4 flex-1">{c.description}</p>

                      <div className="bg-[#050505] rounded-2xl p-4 border border-border/50 mb-4">
                        <div className="font-display text-4xl text-primary leading-none">
                          {formatKES(Number(c.rewardPerView))} <span className="text-sm text-muted font-sans font-normal tracking-wide">/view</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-muted font-bold uppercase tracking-wider text-[10px] px-2 py-1 rounded-md">
                          {c.type}
                        </Badge>
                        {parsedTags?.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 text-muted font-bold uppercase tracking-wider text-[10px] px-2 py-1 rounded-md">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-muted border-t border-border pt-4 mt-auto">
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {c._count?.submissions || 0} subs</span>
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-primary" /> {c.totalSubmissions}/{c.maxSubmissions}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button variant="outline" size="sm" className="bg-card border-border text-white hover:bg-border2 rounded-xl" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm font-bold text-muted tracking-wider uppercase">Page {page} of {data.pagination.totalPages}</span>
              <Button variant="outline" size="sm" className="bg-card border-border text-white hover:bg-border2 rounded-xl" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
