const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Ambil IP outbound dari beberapa layanan sekaligus
    const [r1, r2] = await Promise.allSettled([
      fetch("https://api.ipify.org?format=json").then(r => r.json()),
      fetch("https://api64.ipify.org?format=json").then(r => r.json()),
    ]);

    const ip1 = r1.status === "fulfilled" ? r1.value.ip : null;
    const ip2 = r2.status === "fulfilled" ? r2.value.ip : null;

    return new Response(
      JSON.stringify({
        outbound_ip: ip1 || ip2,
        ipv4: ip1,
        ipv6: ip2,
        note: "Ini adalah IP outbound yang digunakan Edge Function saat memanggil Digiflazz API",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
