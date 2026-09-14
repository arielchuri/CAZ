import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || "Panel drawer"}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#EFECE6] border-l border-[#222D2C] z-50 p-6 flex flex-col"
            style={{
              borderRadius: 0,
              boxShadow: "1px 1px 1px 0 rgba(128, 128, 128, 0.25)",
            }}
          >
            <div className={title ? "flex justify-between items-center mb-5 border-b border-[#222D2C] pb-3" : "flex justify-end items-center mb-4 border-b border-[#222D2C] pb-2"}>
              {title && (
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#222D2C]">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-transparent border border-[#222D2C] hover:bg-[#DF4C40] hover:text-white transition-colors cursor-pointer"
                style={{ borderRadius: 0, boxShadow: "none" }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
