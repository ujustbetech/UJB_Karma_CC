import AdminLayout from "@/components/layout/AdminLayout";

export default function Layout({ children }) {
  return (
    <AdminLayout role="admin">
      {children}
    </AdminLayout>
  );
}
