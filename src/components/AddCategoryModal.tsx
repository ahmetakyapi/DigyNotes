"use client";
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <h2 id="add-category-title" className="mb-5 text-base font-bold text-[var(--text-primary)]">Yeni Kategori</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 text-[16px] text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[#10b981]/60 focus:outline-none focus:ring-1 focus:ring-[#10b981]/20 sm:text-sm"
            placeholder="Kategori adı (örn: Film, Kitap…)"
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.28)] transition-all hover:brightness-110 disabled:opacity-50"
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
