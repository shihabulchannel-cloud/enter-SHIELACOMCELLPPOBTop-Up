import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

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
      if (!reseller_id || !amount || amount < 1000) return respond({ error: "Nominal deposit minimal Rp1.000" });
      const { data: reseller } = await supabase.from("sc_resellers").select("id,name").eq("id", reseller_id).maybeSingle();
      if (!reseller) return respond({ error: "Reseller tidak ditemukan" });
      const { data, error } = await supabase.from("sc_deposits").insert({ reseller_id, reseller_name: reseller.name, amount, bank_target: bank_target || "", proof_image: proof_image || "", status: "pending", notes: notes || "" }).select().single();
      if (error) return respond({ error: error.message });
      return respond({ success: true, deposit: data });
    }

    if (action === "approve") {
      if (!deposit_id) return respond({ error: "deposit_id diperlukan" });
      const { data: deposit } = await supabase.from("sc_deposits").select("*").eq("id", deposit_id).maybeSingle();
      if (!deposit) return respond({ error: "Deposit tidak ditemukan" });
      if (deposit.status !== "pending") return respond({ error: "Deposit sudah diproses sebelumnya" });
      const { data: reseller } = await supabase.from("sc_resellers").select("id,name,balance").eq("id", deposit.reseller_id).maybeSingle();
      if (!reseller) return respond({ error: "Reseller tidak ditemukan" });
      const newBalance = reseller.balance + deposit.amount;
      await supabase.from("sc_resellers").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", reseller.id);
      await supabase.from("sc_deposits").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", deposit_id);
      await addMutation(supabase, reseller.id, reseller.name, "deposit", deposit.amount, reseller.balance, newBalance, `Deposit disetujui admin — ${deposit.bank_target}`, deposit_id);
      return respond({ success: true, new_balance: newBalance });
    }

    if (action === "reject") {
      if (!deposit_id) return respond({ error: "deposit_id diperlukan" });
      const { data: deposit } = await supabase.from("sc_deposits").select("*").eq("id", deposit_id).maybeSingle();
      if (!deposit) return respond({ error: "Deposit tidak ditemukan" });
      if (deposit.status !== "pending") return respond({ error: "Deposit sudah diproses" });
      await supabase.from("sc_deposits").update({ status: "rejected", reject_reason: reject_reason || "Ditolak admin", updated_at: new Date().toISOString() }).eq("id", deposit_id);
      return respond({ success: true });
    }

    if (action === "manual_adjust") {
      const { type, reason } = body;
      if (!reseller_id || !amount || !type) return respond({ error: "Data tidak lengkap" });
      const { data: reseller } = await supabase.from("sc_resellers").select("id,name,balance").eq("id", reseller_id).maybeSingle();
      if (!reseller) return respond({ error: "Reseller tidak ditemukan" });
      const newBalance = type === "add" ? reseller.balance + amount : Math.max(0, reseller.balance - amount);
      await supabase.from("sc_resellers").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", reseller.id);
      await addMutation(supabase, reseller.id, reseller.name, type === "add" ? "manual_add" : "manual_deduct", amount, reseller.balance, newBalance, reason || (type === "add" ? "Penambahan saldo manual oleh admin" : "Pengurangan saldo manual oleh admin"));
      return respond({ success: true, new_balance: newBalance });
    }

    if (action === "list") {
      let query = supabase.from("sc_deposits").select("*").order("created_at", { ascending: false });
      if (reseller_id) query = query.eq("reseller_id", reseller_id);
      const { data } = await query;
      return respond({ success: true, deposits: data || [] });
    }

    return respond({ error: "Action tidak dikenal" });
  } catch (err) {
    return respond({ error: String(err) });
  }
});
