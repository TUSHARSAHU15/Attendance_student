import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function apiEmailPlugin() {
  return {
    name: 'api-email-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/email/')) {
          return next();
        }

        let body = {};
        if (req.method === 'POST') {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const raw = Buffer.concat(buffers).toString();
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
        }

        const resHelper = {
          status(code) {
            res.statusCode = code;
            return this;
          },
          json(data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          }
        };

        const reqHelper = {
          method: req.method,
          body,
          headers: req.headers,
          query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
        };

        try {
          const urlPath = req.url.split('?')[0];
          if (urlPath === '/api/email/password-reset') {
            const { default: handler } = await import('./api/email/password-reset.js');
            return await handler(reqHelper, resHelper);
          } else if (urlPath === '/api/email/validate-token') {
            const { default: handler } = await import('./api/email/validate-token.js');
            return await handler(reqHelper, resHelper);
          } else if (urlPath === '/api/email/reset-password') {
            const { default: handler } = await import('./api/email/reset-password.js');
            return await handler(reqHelper, resHelper);
          }
        } catch (err) {
          console.error('Local API Error:', err);
          return resHelper.status(500).json({ error: err.message });
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiEmailPlugin()],
  server: {
    host: true,
    allowedHosts: true,
  },
})
