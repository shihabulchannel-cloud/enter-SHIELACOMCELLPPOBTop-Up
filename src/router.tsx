import Index from "./pages/Index";
import Products from "./pages/Products";
import CaraTransaksi from "./pages/CaraTransaksi";
import FAQ from "./pages/FAQ";
import CekTransaksi from "./pages/CekTransaksi";
import Reseller from "./pages/Reseller";
import Kontak from "./pages/Kontak";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Order from "./pages/Order";
import Payment from "./pages/Payment";
import OrderStatus from "./pages/OrderStatus";
import NotFound from "./pages/NotFound";
import ResellerLogin from "./pages/reseller/Login";
import ResellerRegister from "./pages/reseller/Register";
import ResellerDashboard from "./pages/reseller/Dashboard";
import ResellerProducts from "./pages/reseller/Products";
import ResellerDeposit from "./pages/reseller/Deposit";
import ResellerHistory from "./pages/reseller/History";
import ResellerMutations from "./pages/reseller/Mutations";
import ResellerProfile from "./pages/reseller/Profile";
import ResellerSupport from "./pages/reseller/Support";
import ResellerRoute from "./components/reseller/ResellerRoute";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/products",
    name: "products",
    element: <Products />,
  },
  {
    path: "/order/:productSku",
    name: "order",
    element: <Order />,
  },
  {
    path: "/payment/:invoiceId",
    name: "payment",
    element: <Payment />,
  },
  {
    path: "/order-status/:invoiceId",
    name: "order-status",
    element: <OrderStatus />,
  },
  {
    path: "/cara-transaksi",
    name: "cara-transaksi",
    element: <CaraTransaksi />,
  },
  {
    path: "/faq",
    name: "faq",
    element: <FAQ />,
  },
  {
    path: "/cek-transaksi",
    name: "cek-transaksi",
    element: <CekTransaksi />,
  },
  {
    path: "/reseller",
    name: "reseller",
    element: <Reseller />,
  },
  {
    path: "/kontak",
    name: "kontak",
    element: <Kontak />,
  },
  {
    path: "/admin",
    name: "admin",
    element: <Admin />,
  },
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    element: <AdminDashboard />,
  },
  /* --- RESELLER ROUTES --- */
  { path: "/reseller/login", name: "reseller-login", element: <ResellerLogin /> },
  { path: "/reseller/register", name: "reseller-register", element: <ResellerRegister /> },
  { path: "/reseller/dashboard", name: "reseller-dashboard", element: <ResellerRoute><ResellerDashboard /></ResellerRoute> },
  { path: "/reseller/products", name: "reseller-products", element: <ResellerRoute><ResellerProducts /></ResellerRoute> },
  { path: "/reseller/deposit", name: "reseller-deposit", element: <ResellerRoute><ResellerDeposit /></ResellerRoute> },
  { path: "/reseller/history", name: "reseller-history", element: <ResellerRoute><ResellerHistory /></ResellerRoute> },
  { path: "/reseller/mutations", name: "reseller-mutations", element: <ResellerRoute><ResellerMutations /></ResellerRoute> },
  { path: "/reseller/profile", name: "reseller-profile", element: <ResellerRoute><ResellerProfile /></ResellerRoute> },
  { path: "/reseller/support", name: "reseller-support", element: <ResellerRoute><ResellerSupport /></ResellerRoute> },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
