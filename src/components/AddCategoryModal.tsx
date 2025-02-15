'use client';

import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";

interface Category {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
}

const AddCategoryModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [categoryName, setCategoryName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryName,
      };
      await addDoc(collection(db, "categories"), {
        name: categoryName,
        createdAt: new Date().toISOString(),
      });
      setCategoryName("");
      onSuccess(newCategory);
      onClose();
    } catch (error) {
      console.error("Error adding category:", error);
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
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
