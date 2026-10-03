import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDirectory = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig(({ mode }) => {
  const frontendEnvironment = loadEnv(
    mode,
    frontendDirectory,
    'API_PROXY_TARGET',
  );
  const proxyTarget =
    frontendEnvironment.API_PROXY_TARGET || 'http://localhost:3001';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
