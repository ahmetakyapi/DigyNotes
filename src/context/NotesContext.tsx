"use client";
import React, { createContext, useContext, useState } from "react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
}

interface NotesContextType {
  notes: Note[];
  categories: string[];
  addNote: (note: Note) => void;
  getNotesByCategory: (categoryId: string) => Note[];
  deleteCategory: (categoryId: string) => void;
}

const NotesContext = createContext<NotesContextType>({} as NotesContextType);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState<
    string | null
  >(null);

  const addNote = (note: Note) => {
    setNotes([...notes, note]);
  };

  const getNotesByCategory = (categoryId: string) => {
    if (categoryId === "all") return notes;
    return notes.filter((note) => note.categoryId === categoryId);
  };

  const deleteCategory = (categoryId: string) => {
    setPendingCategoryDelete(categoryId);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingCategoryDelete) {
      try {
        // Delete from Firebase
        await deleteDoc(doc(db, "categories", pendingCategoryDelete));

        // Update local state
        setNotes((prevNotes) =>
          prevNotes.filter((note) => note.categoryId !== pendingCategoryDelete)
        );
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => cat !== pendingCategoryDelete)
        );

        toast.success("Kategori başarıyla silindi");
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Kategori silinirken bir hata oluştu");
      }
    }
    setIsModalOpen(false);
    setPendingCategoryDelete(null);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        categories,
        addNote,
        getNotesByCategory,
        deleteCategory,
      }}
    >
      {children}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Kategori Sil2"
        message="Kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);
