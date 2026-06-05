import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LegalPage {
  id?: string;
  page_key: string;
  title: string;
  content: string;
  last_updated: string;
}

export interface CompanyInfo {
  id?: string;
  business_name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  whatsapp: string;
  email: string;
  operating_hours: string;
  maps_url: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  business_name: 'SHIELACOM CELL', address: '', city: '', province: '',
  postal_code: '', whatsapp: '', email: '', operating_hours: 'Senin-Minggu: 08.00 - 22.00 WIB', maps_url: '',
};

export function useLegalPage(pageKey: string) {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('sc_legal_pages').select('*').eq('page_key', pageKey).maybeSingle()
      .then(({ data }) => { setPage(data); setLoading(false); });
  }, [pageKey]);
  return { page, loading };
}

export function useCompanyInfo() {
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    const { data } = await supabase.from('sc_company_info').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    setCompany(data || DEFAULT_COMPANY);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);
  return { company, loading, reload };
}
