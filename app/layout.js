import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthProvider } from "@/context/authContext";
import { mukta } from "./fonts";

export const metadata = {
  title: "Ujustbe",
  description: "Cosmic Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={mukta.className}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}