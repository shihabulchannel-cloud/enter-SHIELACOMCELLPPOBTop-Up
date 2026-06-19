// Frontend API calls to edge functions
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://spb-t4n14k6xzom7uus1.supabase.opentrust.net";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG4xNGs2eHpvbTd1dXMxIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODA0ODI2NDQsImV4cCI6MjA5NjA1ODY0NH0.YVPHGox4JhgzTsdl3T2ERq4na1zG3pdv1z_cZKpiOOs";

export interface CreateOrderParams {
  product_sku: string;
  target: string;
  target_detail?: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_whatsapp?: string;
  payment_method: string;
  payment_gateway: string;
}

export interface CreateOrderResult {
  success: boolean;
  invoice_id: string;
  payment_method: string;
  payment_gateway: string;
  payment_code: string;
  payment_url: string;
  payment_amount: number;
  payment_fee: number;
  product_price: number;
  product_name: string;
  buyer_name: string;
  target: string;
  expired_at: string;
  order_status: string;
  error?: string;
}

export interface OrderStatus {
  id: string;
  invoice_id: string;
  product_sku: string;
  product_name: string;
  product_price: number;
  buyer_name: string;
  buyer_email: string;
  buyer_whatsapp: string;
  target: string;
  target_detail: string;
  payment_method: string;
  payment_gateway: string;
  payment_amount: number;
  payment_fee: number;
  payment_status: string;
  payment_code: string;
  payment_url: string;
  order_status: string;
  digiflazz_sn: string;
  notes: string;
  // manual payment fields
  payment_proof_url: string;
  reject_reason: string;
  manual_payment_type: string;
  digiflazz_sent: boolean;
  created_at: string;
  expired_at: string;
  updated_at: string;
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: params,
  });
  if (error) throw new Error(error.message || 'Gagal membuat order');
  if (data?.error) throw new Error(data.error);
  return data as CreateOrderResult;
}

export async function checkOrder(invoiceId: string): Promise<OrderStatus> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/check-order?invoice_id=${encodeURIComponent(invoiceId)}`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    }
  );
  const result = await res.json();
  if (!res.ok || result.error) throw new Error(result.error || 'Order tidak ditemukan');
  return result.order as OrderStatus;
}

export async function getProductsFromDB(categoryId?: string) {
  let query = supabase.from('sc_products').select('*').eq('active', true).order('brand').order('sell_price');
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProductBySku(sku: string) {
  const { data, error } = await supabase
    .from('sc_products')
    .select('*')
    .eq('sku', sku)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
