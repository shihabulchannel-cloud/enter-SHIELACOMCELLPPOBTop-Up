import { Navigate } from 'react-router-dom';
import { isAdminLoggedIn } from '@/lib/admin-auth';

/**
 * AdminRoute — route guard untuk halaman admin.
 * Redirect ke /admin (login) jika session tidak valid atau sudah expired.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminLoggedIn()) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
