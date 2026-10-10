import { Metadata } from "next";
import { NO_INDEX } from "@/lib/metadata";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "DigyNotes hesabına giriş yap.",
  robots: NO_INDEX,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
