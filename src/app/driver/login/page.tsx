"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function DriverLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBusId = searchParams.get("bus_id")?.trim() || "";
  const [busId, setBusId] = useState(queryBusId);

  useEffect(() => {
    if (queryBusId) {
      router.replace(`/driver/bus/${queryBusId}`);
    }
  }, [queryBusId, router]);

  if (queryBusId) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-6 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold mb-2">Open Bus Dashboard</h1>
        <p className="text-muted-foreground mb-5">
          Enter the bus ID assigned by admin to open the dedicated bus driver page.
        </p>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busId.trim()) return;
            router.push(`/driver/bus/${encodeURIComponent(busId.trim())}`);
          }}
        >
          <div>
            <label className="text-sm font-medium mb-2 block">Bus ID</label>
            <input
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g. 12"
              value={busId}
              onChange={(event) => setBusId(event.target.value)}
              required
              autoFocus
            />
          </div>

          <button type="submit" className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
            Open Dedicated Bus Page
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DriverLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    }>
      <DriverLoginInner />
    </Suspense>
  );
}
