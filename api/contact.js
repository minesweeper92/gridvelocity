module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name, email, company, services, budget, message,
    'cf-turnstile-response': token,
  } = req.body || {};

  // Server-side validation
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  // Verify Cloudflare Turnstile token
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  const tsData = await tsRes.json();
  console.log('Turnstile result:', JSON.stringify(tsData));
  if (!tsData.success) {
    return res.status(400).json({ error: 'Security check failed. Please refresh and try again.' });
  }

  // Send email via Resend
  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Grid Velocity Website <noreply@forms.gridvelocity.com>',
      to: ['hello@gridvelocity.com'],
      reply_to: email,
      subject: company ? `Enquiry — ${company}` : `Enquiry — ${name}`,
      html: buildEmailHtml({ name, email, company, services, budget, message }),
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Could not send your message. Please email hello@gridvelocity.com directly.' });
  }

  return res.status(200).json({ ok: true });
};

function buildEmailHtml({ name, email, company, services, budget, message }) {
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const rows = [
    ['Name',     esc(name)],
    ['Email',    `<a href="mailto:${esc(email)}" style="color:#EF4823">${esc(email)}</a>`],
    company  ? ['Company',  esc(company)]  : null,
    services ? ['Services', esc(services)] : null,
    budget   ? ['Budget',   esc(budget)]   : null,
  ].filter(Boolean).map(([k, v]) => `
    <tr>
      <td style="padding:6px 20px 6px 0;font-size:13px;color:#888;white-space:nowrap;vertical-align:top">${k}</td>
      <td style="padding:6px 0;font-size:14px;color:#111">${v}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #eee">
  <tr><td style="background:#EF4823;padding:20px 28px">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em">Grid Velocity</p>
    <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700">New project enquiry</h1>
  </td></tr>
  <tr><td style="padding:28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">${rows}</table>
    <div style="background:#f7f7f7;border-radius:8px;padding:18px;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap">${esc(message)}</div>
    <p style="margin:24px 0 0;font-size:11px;color:#bbb">Submitted via gridvelocity.com/contact · Reply directly to this email to respond to ${esc(name)}.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
