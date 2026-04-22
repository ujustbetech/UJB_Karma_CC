"use client";

import { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);
let toastCounter = 0;

function createToastId() {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = toast.id ?? createToastId();

    setToasts((prev) => [
      ...prev,
      { id, ...toast },
    ]);

    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 3000);
  }, [removeToast]);

  const api = {
    success: (message, options = {}) =>
      showToast({
        type: "success",
        message,
        ...options,
      }),

    error: (message, options = {}) =>
      showToast({
        type: "error",
        message,
        ...options,
      }),

    info: (message, options = {}) =>
      showToast({
        type: "info",
        message,
        ...options,
      }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast must be used within ToastProvider"
    );
  }
  return ctx;
}
