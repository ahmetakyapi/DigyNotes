"use client";
import { useParams, useRouter } from "next/navigation";
import { useNotes } from "@/context/NotesContext";
import NotesList from "@/components/NotesList";
import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const { getNotesByCategory, deleteCategory } = useNotes();
  const filteredNotes = getNotesByCategory(categoryId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteCategory = () => {
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteCategory(categoryId);
    router.push("/");
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Category: {categoryId}</h1>
        <button
          onClick={handleDeleteCategory}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-black transition-colors"
          aria-label="Delete category"
        >
          ✕
        </button>
      </div>
      <NotesList notes={filteredNotes} />
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Kategori Sil"
        message="Kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
