"use client";
import { Toaster } from "react-hot-toast";

/* One Toaster for every route (mounted in the root layout): pages without the app shell
   (auth pages, anonymous profile/collections) toast too, and queued toasts never pile up
   to flash once the shell mounts after sign-in. */
export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          fontSize: "14px",
          borderRadius: "10px",
        },
        success: { iconTheme: { primary: "var(--gold)", secondary: "var(--text-on-accent)" } },
      }}
    />
  );
}
