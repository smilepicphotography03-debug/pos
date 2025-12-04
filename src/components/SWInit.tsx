"use client";

import { useEffect } from "react";

export default function SWInit() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("SW registered ✔"))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return null;
}
