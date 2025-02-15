"use client";
import { useParams } from "next/navigation";
import { useNotes } from "@/context/NotesContext";
import NotesList from "@/components/NotesList";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const { getNotesByCategory } = useNotes();
  const filteredNotes = getNotesByCategory(categoryId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Category: {categoryId}</h1>
      <NotesList notes={filteredNotes} />
    </div>
  );
}
