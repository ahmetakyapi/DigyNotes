"use client";
import React, { createContext, useContext, useState } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Note) => void;
  getNotesByCategory: (categoryId: string) => Note[];
}

const NotesContext = createContext<NotesContextType>({} as NotesContextType);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = (note: Note) => {
    setNotes([...notes, note]);
  };

  const getNotesByCategory = (categoryId: string) => {
    if (categoryId === 'all') return notes;
    return notes.filter(note => note.categoryId === categoryId);
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, getNotesByCategory }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);
