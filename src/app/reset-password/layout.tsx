import { Metadata } from "next";
import { NO_INDEX } from "@/lib/metadata";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  description: "DigyNotes hesabın için yeni bir şifre belirle.",
  robots: NO_INDEX,
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
