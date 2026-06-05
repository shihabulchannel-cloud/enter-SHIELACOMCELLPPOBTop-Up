import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import { useLegalPage, useCompanyInfo } from '@/hooks/useLegalData';
import { FileText } from 'lucide-react';

// Simple markdown-like renderer for the content
function renderContent(content: string) {
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      result.push(<h2 key={key++} className="text-lg font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      result.push(<h1 key={key++} className="text-2xl font-bold text-foreground mt-6 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ')) {
      result.push(<li key={key++} className="ml-4 text-muted-foreground text-sm list-disc">{line.slice(2)}</li>);
    } else if (line.trim() === '') {
      result.push(<div key={key++} className="h-2" />);
    } else {
      result.push(<p key={key++} className="text-muted-foreground text-sm leading-relaxed">{line}</p>);
    }
  }
  return result;
}

interface Props { pageKey: string; }

export default function LegalPage({ pageKey }: Props) {
  const { page, loading } = useLegalPage(pageKey);
  const { company } = useCompanyInfo();

  const titleMap: Record<string, string> = {
    refund_policy: 'Kebijakan Pengembalian Dana',
    privacy_policy: 'Kebijakan Privasi',
    terms_conditions: 'Syarat dan Ketentuan',
  };

  const displayTitle = page?.title || titleMap[pageKey] || 'Legal';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <FileText className="w-4 h-4 text-white/80" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Legal</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{displayTitle}</h1>
            {page?.last_updated && (
              <p className="text-white/50 text-xs mt-2">
                Terakhir diperbarui: {new Date(page.last_updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(8)].map((_, i) => <div key={i} className={`h-4 bg-muted rounded ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} />)}
                </div>
              ) : page ? (
                <div className="prose-content">
                  {/* Company name intro */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{company.business_name}</span>
                    {company.address && <> · {company.address}{company.city ? `, ${company.city}` : ''}</>}
                  </div>
                  {renderContent(page.content)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Konten tidak tersedia</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
