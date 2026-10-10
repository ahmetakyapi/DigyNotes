import { Metadata } from "next";
import { NO_INDEX } from "@/lib/metadata";

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Bir DigyNotes hesabı aç; film, dizi, oyun, kitap ve gezi notlarını tut.",
  robots: NO_INDEX,
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
