"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Crown } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  creatorProfile?: { displayName: string; trustScore: number; isThe100Member: boolean } | null;
  brandProfile?: { companyName: string; isVerified: boolean } | null;
}

const roleVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ADMIN: "destructive", BRAND: "secondary", CREATOR: "default",
};
const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVE: "success", PENDING_VERIFICATION: "warning", SUSPENDED: "destructive", BANNED: "destructive",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, role, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: "20", search });
      if (role !== "all") params.set("role", role);
      const res = await fetch(`/api/admin/users?${params}`);
      return res.json();
    },
  });

  const inviteThe100 = useMutation({
    mutationFn: async (creatorId: string) => {
      const res = await fetch("/api/admin/the-100/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Failed");
      return d;
    },
    onSuccess: () => {
      toast.success("Creator invited to The 100!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Manage Users</h1>
        <p className="text-gray-500 mt-1">{data?.total || 0} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-10" placeholder="Search by email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="CREATOR">Creator</SelectItem>
            <SelectItem value="BRAND">Brand</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data?.map((u: UserRow) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.creatorProfile?.displayName || u.brandProfile?.companyName || u.email}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleVariant[u.role] || "secondary"} className="text-xs">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[u.status] || "secondary"} className="text-xs">{u.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-KE")}
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "CREATOR" && u.creatorProfile && !u.creatorProfile.isThe100Member && (
                          <Button variant="outline" size="sm" onClick={() => inviteThe100.mutate(u.creatorProfile!.displayName)} disabled={inviteThe100.isPending}>
                            <Crown className="w-3 h-3 mr-1" /> Invite to 100
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
