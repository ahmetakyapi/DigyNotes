import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-[#252d40] bg-[#151b2d] p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-[#e8eaf6]">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-[#8892b0]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-3 text-sm text-[#8892b0] transition-colors hover:text-[#e8eaf6]"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-[#e53e3e] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};
