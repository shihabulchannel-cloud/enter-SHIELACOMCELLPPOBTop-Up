import { Navigate } from 'react-router-dom';
import { isResellerLoggedIn } from '@/lib/reseller-auth';

export default function ResellerRoute({ children }: { children: React.ReactNode }) {
  if (!isResellerLoggedIn()) return <Navigate to="/reseller/login" replace />;
  return <>{children}</>;
}
