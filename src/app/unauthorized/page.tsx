import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ShieldAlert className="w-16 h-16 text-[#E63946] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#0D1B2A] mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You don&apos;t have permission to access this page.</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
