# Fantasy – Amigas del Duero (Next.js + TS)

App minimalista para seleccionar un 5 (campo) y enviarlo por email a un buzón fijo, funcionando 24/7.

## 🚀 Despliegue rápido (Vercel)

1. **Descarga** este proyecto y súbelo a un repo (GitHub/GitLab).
2. Crea un proyecto en **Vercel** e importa el repo.
3. En **Settings → Environment Variables**, añade:
   - `RESEND_API_KEY` → Tu API Key de [Resend](https://resend.com).
   - `MAIL_FROM` → Email de un **dominio verificado** en Resend. Ej: `noreply@tudominio.com`.
   - `MAIL_TO` → Email destino (por defecto: `08guillem80@gmail.com`).
   - `NEXT_PUBLIC_MAIL_TO` → (Opcional) para mostrar el destino en la UI.
4. Deploy.

> Nota: Vercel no permite SMTP saliente en serverless; por eso usamos **Resend** (HTTPS).

## 🧪 Desarrollo local

```bash
npm i
npm run dev
```

Luego abre http://localhost:3000

Configura `.env.local` con:
```
RESEND_API_KEY=...
MAIL_FROM=noreply@tudominio.com
MAIL_TO=08guillem80@gmail.com
NEXT_PUBLIC_MAIL_TO=08guillem80@gmail.com
```

## 🛡️ Anti‑spam básico
- Campo oculto *honeypot* (`botField`) en el formulario.
- Valida en API: método POST, campos requeridos, formación completa y capitana.

## 🧰 Personalización
- Edita jugadores/roles en `pages/index.tsx` y en `pages/api/submit.ts` (mapa de nombres).
- Cambia formaciones en `FORMATIONS`.
- El botón de envío usa `/api/submit` (serverless) → correo a `MAIL_TO`.

## 📈 Siguientes pasos (opcionales)
- Guardar también en Google Sheets (API) o Supabase para clasificaciones.
- Añadir Captcha (hCaptcha/Cloudflare Turnstile).
- Dominio propio (Vercel → Domains).
- Política de privacidad/consentimiento RGPD.
