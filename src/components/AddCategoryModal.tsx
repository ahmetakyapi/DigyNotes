'use client';

import React, { useState } from "react";
import { addCategory, Category } from "@/services/firebase/categoryService";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
}

const AddCategoryModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    
    setIsLoading(true);
    try {
      const newCategory = await addCategory(categoryName.trim());
      onSuccess(newCategory);
      setCategoryName("");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Category eklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Yeni Kategori Ekle</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Kategori adı"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading}
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
