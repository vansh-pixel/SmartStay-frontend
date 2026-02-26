import "./styles/admin.css"; 
import AdminGuard from "./AdminGuard";

export const metadata = {
  title: 'Admin Dashboard | SmartStay',
};

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}