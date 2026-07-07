import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import Breadcrumb from '@/components/products/Breadcrumb';
import BrandTabs from '@/components/products/BrandTabs';
import CategoryBanner from '@/components/products/CategoryBanner';
import FAQSection from '@/components/products/FAQSection';
import PromoSection from '@/components/products/PromoSection';
import ProductGrid from '@/components/products/ProductGrid';
import SubCategoryGrid from '@/components/products/SubCategoryGrid';
import {
  getCategoryBySlugDynamic,
  slugToBrand,
  setCategoryMeta,
} from '@/lib/product-slugs';
import { getProductsFromDB } from '@/lib/order-api';
import { getCmsSubCategories, getCmsCategoryBySlug, type CmsCategory } from '@/lib/cms-api';
import type { ProductItem } from '@/components/products/ProductCard';

export default function ProductCatalog() {
  const { categorySlug, brandSlug } = useParams<{
    categorySlug: string;
    brandSlug?:   string;
  }>();
  const navigate = useNavigate();

  const [products,    setProducts]    = useState<ProductItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [cmsSubCats,  setCmsSubCats]  = useState<CmsCategory[]>([]);
  const [cmsLoading,  setCmsLoading]  = useState(false);
  const [cmsCatData,  setCmsCatData]  = useState<CmsCategory | null>(null);

  // Resolve slug → metadata (includes custom categories from admin)
  const category = getCategoryBySlugDynamic(categorySlug ?? '');

  // If invalid category slug → redirect
  useEffect(() => {
    if (!loading && !category) navigate('/products', { replace: true });
  }, [category, loading, navigate]);

  // Fetch CMS sub-categories when on category landing page (no brandSlug)
  useEffect(() => {
    if (!categorySlug || brandSlug) {
      setCmsSubCats([]);
      return;
    }
    setCmsLoading(true);
    getCmsSubCategories(categorySlug)
      .then(data => setCmsSubCats(data.filter(c => c.is_active)))
      .catch(() => setCmsSubCats([]))
      .finally(() => setCmsLoading(false));
  }, [categorySlug, brandSlug]);

  // Fetch CMS top-level category data (for banner URL)
  useEffect(() => {
    if (!categorySlug) return;
    getCmsCategoryBySlug(categorySlug, null)
      .then(data => setCmsCatData(data))
      .catch(() => {});
  }, [categorySlug]);

  // Fetch all products for this category
  // Only load products when brandSlug is set OR when CMS has no sub-cats
  const loadProducts = async () => {
    if (!category) return;
    setLoading(true);
    setError('');
    try {
      const data = await getProductsFromDB(category.id);
      setProducts(data as ProductItem[]);
    } catch {
      setError('Gagal memuat produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProducts([]);
    setSearch('');
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]);

  // Unique sorted brands from loaded products
  const allBrands = useMemo(
    () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(),
    [products],
  );

  // Product count per brand — passed to SubCategoryGrid for "X produk" badge
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.brand) counts[p.brand] = (counts[p.brand] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  // Resolve brand slug → brand name
  const activeBrandName = brandSlug ? slugToBrand(brandSlug, allBrands) : null;

  // If brand slug given but no match after products load → redirect to category
  useEffect(() => {
    if (!loading && brandSlug && allBrands.length > 0 && !activeBrandName) {
      navigate(`/products/${categorySlug}`, { replace: true });
    }
  }, [loading, brandSlug, activeBrandName, allBrands.length, categorySlug, navigate]);

  // Filter by brand + search
  const filtered = useMemo(() => {
    let list = products;
    if (activeBrandName) list = list.filter(p => p.brand === activeBrandName);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, activeBrandName, search]);

  // SEO metadata
  useEffect(() => {
    setCategoryMeta(category, activeBrandName);
  }, [category, activeBrandName]);

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; href?: string }[] = [
      { label: 'Produk', href: '/products' },
    ];
    if (category) {
      items.push({
        label: category.label,
        href:  activeBrandName ? `/products/${categorySlug}` : undefined,
      });
    }
    if (activeBrandName) items.push({ label: activeBrandName });
    return items;
  }, [category, categorySlug, activeBrandName]);

  // Sub-category grid mode:
  // Show if: no brandSlug, CMS sub-cats loaded, and at least one exists
  const showSubCatGrid = !brandSlug && !cmsLoading && cmsSubCats.length > 0;

  if (!category && !loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero Banner */}
        {category && (
          <CategoryBanner
            category={category}
            brandName={activeBrandName}
            search={showSubCatGrid ? '' : search}
            onSearch={showSubCatGrid ? () => {} : setSearch}
            totalCount={showSubCatGrid ? cmsSubCats.length : filtered.length}
            hideSearch={showSubCatGrid}
            cmsbannerUrl={cmsCatData?.banner_url || undefined}
          />
        )}

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* ── SUB-CATEGORY GRID MODE ── */}
        {(showSubCatGrid || cmsLoading) && !brandSlug ? (
          <section className="py-8 bg-background">
            <div className="container mx-auto px-4">
              {!cmsLoading && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    Pilih {category?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Klik untuk melihat produk dan harga terbaik
                  </p>
                </div>
              )}
              <SubCategoryGrid
                items={cmsSubCats}
                categorySlug={categorySlug ?? ''}
                productCounts={productCounts}
                loading={cmsLoading}
              />
            </div>
          </section>
        ) : (
          <>
            {/* Brand Tabs — URL-based navigation */}
            {allBrands.length > 1 && category && !showSubCatGrid && (
              <BrandTabs
                brands={allBrands}
                categorySlug={category.slug}
                activeBrandSlug={brandSlug}
              />
            )}

            {/* Product Grid */}
            <section className="py-8 bg-background" id={`produk-${category?.id}`}>
              <div className="container mx-auto px-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Memuat produk...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={loadProducts} variant="outline" className="rounded-xl gap-2">
                      <RefreshCw className="w-4 h-4" /> Coba Lagi
                    </Button>
                  </div>
                ) : (
                  <>
                    {activeBrandName && (
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-1 h-5 rounded-full bg-primary" />
                        <h2 className="text-lg font-bold text-foreground">{activeBrandName}</h2>
                        <span className="text-muted-foreground text-sm">({filtered.length} produk)</span>
                      </div>
                    )}

                    {/* Group by brand if no active brand filter */}
                    {!activeBrandName && allBrands.length > 1 ? (
                      <div className="space-y-10">
                        {allBrands.map(brand => {
                          const brandProds = filtered.filter(p => p.brand === brand);
                          if (brandProds.length === 0) return null;
                          return (
                            <div key={brand}>
                              <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <span className="w-1 h-3 rounded-full bg-primary inline-block" />
                                {brand}
                              </p>
                              <ProductGrid products={brandProds} />
                            </div>
                          );
                        })}
                        {filtered.length === 0 && (
                          <ProductGrid
                            products={[]}
                            emptyMessage={`Tidak ada produk ${category?.label.toLowerCase() ?? ''} yang cocok.`}
                          />
                        )}
                      </div>
                    ) : (
                      <ProductGrid products={filtered} emptyMessage="Tidak ada produk ditemukan." />
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Promo & FAQ — only when loaded */}
            {category && !loading && !error && <PromoSection category={category} />}
            {category && <FAQSection category={category} />}
          </>
        )}

      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
