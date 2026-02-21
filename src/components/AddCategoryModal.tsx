"use client";
import React, { useState } from "react";
import { Category } from "@/types";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
}

const AddCategoryModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.status === 409) {
        toast.error("Bu kategori zaten mevcut");
        return;
      }
      if (!res.ok) throw new Error();
      const category: Category = await res.json();
      onSuccess(category);
      setName("");
    } catch {
      toast.error("Kategori eklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#151b2d] border border-[#252d40] rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#e8eaf6] mb-5">
          Yeni Kategori
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-[#e8eaf6] placeholder-[#4a5568]
                       bg-[#0f1117] border border-[#252d40]
                       focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20
                       transition-colors text-sm mb-4"
            placeholder="Kategori adı (örn: Film, Kitap…)"
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold bg-[#c9a84c] text-[#0f1117]
                         rounded-md hover:bg-[#e0c068] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
