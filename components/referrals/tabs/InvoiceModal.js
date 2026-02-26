import { X } from "lucide-react";

export default function InvoiceModal({ url, onClose }) {

  const isPDF = url?.toLowerCase().includes(".pdf");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md relative p-4">
        <button onClick={onClose} className="absolute top-3 right-3">
          <X size={20} />
        </button>

        {isPDF ? (
          <iframe src={url} className="w-full h-[400px]" />
        ) : (
          <img src={url} alt="Invoice" className="w-full rounded" />
        )}
      </div>
    </div>
  );
}