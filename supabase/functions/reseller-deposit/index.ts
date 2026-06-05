import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function addMutation(supabase: ReturnType<typeof createClient>, resellerId: string, resellerName: string, type: string, amount: number, balanceBefore: number, balanceAfter: number, description: string, refId = "") {
  await supabase.from("sc_wallet_mutations").insert({ reseller_id: resellerId, reseller_name: resellerName, type, amount, balance_before: balanceBefore, balance_after: balanceAfter, description, ref_id: refId });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    const { action, reseller_id, amount, bank_target, proof_image, deposit_id, reject_reason, notes } = body;

    if (action === "submit") {
      // Reseller submit deposit
      if (!reseller_id || !amount || amount < 1000) return new Response(JSON.stringify({ error: "Nominal deposit minimal Rp1.000" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: reseller } = await supabase.from("sc_resellers").select("id,name").eq("id", reseller_id).maybeSingle();
      if (!reseller) return new Response(JSON.stringify({ error: "Reseller tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data, error } = await supabase.from("sc_deposits").insert({ reseller_id, reseller_name: reseller.name, amount, bank_target: bank_target || "", proof_image: proof_image || "", status: "pending", notes: notes || "" }).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, deposit: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "approve") {
      // Admin approve deposit → add balance + mutation
      if (!deposit_id) return new Response(JSON.stringify({ error: "deposit_id diperlukan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: deposit } = await supabase.from("sc_deposits").select("*").eq("id", deposit_id).maybeSingle();
      if (!deposit) return new Response(JSON.stringify({ error: "Deposit tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (deposit.status !== "pending") return new Response(JSON.stringify({ error: "Deposit sudah diproses sebelumnya" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: reseller } = await supabase.from("sc_resellers").select("id,name,balance").eq("id", deposit.reseller_id).maybeSingle();
      if (!reseller) return new Response(JSON.stringify({ error: "Reseller tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const newBalance = reseller.balance + deposit.amount;
      await supabase.from("sc_resellers").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", reseller.id);
      await supabase.from("sc_deposits").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", deposit_id);
      await addMutation(supabase, reseller.id, reseller.name, "deposit", deposit.amount, reseller.balance, newBalance, `Deposit disetujui admin — ${deposit.bank_target}`, deposit_id);
      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reject") {
      if (!deposit_id) return new Response(JSON.stringify({ error: "deposit_id diperlukan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: deposit } = await supabase.from("sc_deposits").select("*").eq("id", deposit_id).maybeSingle();
      if (!deposit) return new Response(JSON.stringify({ error: "Deposit tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (deposit.status !== "pending") return new Response(JSON.stringify({ error: "Deposit sudah diproses" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("sc_deposits").update({ status: "rejected", reject_reason: reject_reason || "Ditolak admin", updated_at: new Date().toISOString() }).eq("id", deposit_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "manual_adjust") {
      // Admin manual add/deduct balance
      const { type, reason } = body; // type: 'add' | 'deduct'
      if (!reseller_id || !amount || !type) return new Response(JSON.stringify({ error: "Data tidak lengkap" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: reseller } = await supabase.from("sc_resellers").select("id,name,balance").eq("id", reseller_id).maybeSingle();
      if (!reseller) return new Response(JSON.stringify({ error: "Reseller tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const newBalance = type === "add" ? reseller.balance + amount : Math.max(0, reseller.balance - amount);
      await supabase.from("sc_resellers").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", reseller.id);
      await addMutation(supabase, reseller.id, reseller.name, type === "add" ? "manual_add" : "manual_deduct", amount, reseller.balance, newBalance, reason || (type === "add" ? "Penambahan saldo manual oleh admin" : "Pengurangan saldo manual oleh admin"));
      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      // List deposits (all or by reseller)
      let query = supabase.from("sc_deposits").select("*").order("created_at", { ascending: false });
      if (reseller_id) query = query.eq("reseller_id", reseller_id);
      const { data } = await query;
      return new Response(JSON.stringify({ success: true, deposits: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Action tidak dikenal" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
