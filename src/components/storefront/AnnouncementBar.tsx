"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Reads the publicly-readable `settings/storefront` doc (see firestore.rules)
// and shows the admin-configured announcement bar. Non-critical: renders
// nothing if disabled, empty, or unreadable.
export default function AnnouncementBar() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "storefront"));
        if (cancelled || !snap.exists()) return;
        const data = snap.data() as { announcement?: string; announcementActive?: boolean };
        if (data.announcementActive && data.announcement?.trim()) {
          setMessage(data.announcement.trim());
        }
      } catch {
        // ignore — announcement bar is best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  return (
    <div className="bg-ink-900 text-white text-center text-xs sm:text-sm font-semibold px-4 py-2 tracking-wide">
      {message}
    </div>
  );
}
