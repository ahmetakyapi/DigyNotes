import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, deleteDoc, doc } from "firebase/firestore";

export interface Category {
  id: string;
  name: string;
}

export const addCategory = async (categoryName: string): Promise<Category> => {
  const docRef = await addDoc(collection(db, "categories"), {
    name: categoryName,
  });

  return {
    id: docRef.id,
    name: categoryName,
  };
};

export const getCategories = async (): Promise<Category[]> => {
  const categoriesQuery = query(collection(db, "categories"));
  const querySnapshot = await getDocs(categoriesQuery);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await deleteDoc(doc(db, 'categories', categoryId));
};
