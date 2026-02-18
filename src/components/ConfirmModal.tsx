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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-[#151b2d] border border-[#252d40] rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-base font-bold text-[#e8eaf6] mb-2">{title}</h3>
        <p className="text-sm text-[#8892b0] mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold bg-[#e53e3e] text-white rounded-md
                       hover:bg-red-500 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};
