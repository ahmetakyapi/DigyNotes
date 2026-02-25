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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-[#252d40] bg-[#151b2d] p-6 shadow-2xl">
        <h2 className="mb-5 text-base font-bold text-[#e8eaf6]">Yeni Kategori</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-[#252d40] bg-[#0f1117] px-4 py-3 text-sm text-[#e8eaf6] placeholder-[#4a5568] transition-colors focus:border-[#c9a84c] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20"
            placeholder="Kategori adı (örn: Film, Kitap…)"
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-3 text-sm text-[#8892b0] transition-colors hover:text-[#e8eaf6]"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-[#c9a84c] px-5 py-3 text-sm font-semibold text-[#0f1117] transition-colors hover:bg-[#e0c068] disabled:opacity-50"
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
