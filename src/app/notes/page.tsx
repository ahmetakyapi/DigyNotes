import { Metadata } from "next";
import NotesPageClient from "./NotesPageClient";

export const metadata: Metadata = {
  title: "Notlarım",
  description: "Film, dizi, kitap ve daha fazlası hakkındaki notlarım.",
};

export default function NotesPage({ searchParams }: { searchParams?: { q?: string } }) {
  return <NotesPageClient initialQuery={searchParams?.q ?? ""} />;
}
