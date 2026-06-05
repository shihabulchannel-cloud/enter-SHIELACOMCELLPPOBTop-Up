import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import HeroSlider from '@/components/home/HeroSlider';
import StatsCounter from '@/components/home/StatsCounter';
import ProductCategories from '@/components/home/ProductCategories';
import Features from '@/components/home/Features';
import HowToTransact from '@/components/home/HowToTransact';
import FAQSection from '@/components/home/FAQSection';
import JoinReseller from '@/components/home/JoinReseller';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSlider />
        <StatsCounter />
        <ProductCategories />
        <Features />
        <HowToTransact />
        <FAQSection />
        <JoinReseller />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
