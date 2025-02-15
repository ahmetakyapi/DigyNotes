import React from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
}

interface NotesListProps {
  notes: Note[];
}

export default function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return <div className="text-gray-500">No notes found in this category.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <div key={note.id} className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">{note.title}</h2>
          <p className="text-gray-600">{note.content}</p>
        </div>
      ))}
    </div>
  );
}
