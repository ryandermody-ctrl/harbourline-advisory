const HTML = `<!doctype html>
<html lang="en-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Harbour Line Advisory</title>
  <style>
    :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f1ea; color: #15342d; }
    main { width: min(720px, calc(100% - 40px)); padding: 56px 0; }
    .mark { width: 54px; height: 4px; margin-bottom: 30px; background: #b88b45; }
    h1 { margin: 0 0 34px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(2.2rem, 7vw, 4.4rem); font-weight: 500; line-height: .98; letter-spacing: -.035em; }
    section { max-width: 610px; padding: 22px 0; border-top: 1px solid rgba(21, 52, 45, .22); }
    h2 { margin: 0 0 10px; font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; }
    p { margin: 0; font-size: clamp(1rem, 2.5vw, 1.15rem); line-height: 1.65; }
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true"></div>
    <h1>Harbour Line<br>Advisory</h1>
    <section aria-labelledby="english-heading">
      <h2 id="english-heading">Website update</h2>
      <p>Our website is temporarily unavailable while we complete an update. Please check back shortly. Existing clients may continue to contact their Harbour Line representative through established channels.</p>
    </section>
    <section lang="fr-CA" aria-labelledby="french-heading">
      <h2 id="french-heading">Mise à jour du site</h2>
      <p>Notre site Web est temporairement indisponible pendant que nous effectuons une mise à jour. Veuillez revenir bientôt. Les clients actuels peuvent continuer de communiquer avec leur représentant de Harbour Line par les moyens habituels.</p>
    </section>
  </main>
</body>
</html>`;

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "Content-Type": "text/html; charset=utf-8",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "no-referrer",
  "Retry-After": "3600",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export default {
  async fetch(request) {
    const body = request.method === "HEAD" ? null : HTML;
    return new Response(body, { status: 503, headers: HEADERS });
  },
};
