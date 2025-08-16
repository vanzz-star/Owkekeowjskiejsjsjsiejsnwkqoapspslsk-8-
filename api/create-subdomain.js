export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { subdomain, ip } = req.body;

  if (!subdomain || !ip) {
    return res.status(400).json({ ok: false, error: "Subdomain dan IP wajib diisi" });
  }

  const ROOT_DOMAIN = process.env.ROOT_DOMAIN;
  const ZONE_ID = process.env.ZONE_ID;
  const TOKEN = process.env.CF_API_TOKEN;

  if (!ROOT_DOMAIN || !ZONE_ID || !TOKEN) {
    return res.status(500).json({ ok: false, error: "Server configuration error" });
  }

  try {
    const name = `${subdomain}.${ROOT_DOMAIN}`;
    const cfResp = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "A",
        name,
        content: ip,
        ttl: 1,
        proxied: false
      })
    });

    const data = await cfResp.json();

    if (!data.success) {
      return res.status(400).json({ ok: false, error: data.errors?.[0]?.message || "Gagal membuat subdomain" });
    }

    return res.status(200).json({ ok: true, subdomain: name, ip });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Kesalahan server" });
  }
        }
