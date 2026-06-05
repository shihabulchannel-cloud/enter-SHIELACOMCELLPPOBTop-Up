import Index from "./pages/Index";
import Products from "./pages/Products";
import CaraTransaksi from "./pages/CaraTransaksi";
import FAQ from "./pages/FAQ";
import CekTransaksi from "./pages/CekTransaksi";
import Reseller from "./pages/Reseller";
import Kontak from "./pages/Kontak";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

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
