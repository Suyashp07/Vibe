'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminEventsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-[#64748B]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 text-[#0A0A0A] animate-spin" />
        <span className="text-xs uppercase tracking-widest font-mono text-[#94A3B8]">
          Redirecting to Admin Dashboard...
        </span>
      </div>
    </div>
  );
}
