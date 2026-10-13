import { Metadata } from "next";
import { NO_INDEX } from "@/lib/metadata";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "DigyNotes şifreni sıfırlamak için bağlantı iste.",
  robots: NO_INDEX,
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
