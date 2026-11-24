import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Own ports so Blush Slice never collides with other local projects (5173 / 3000).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY || 'http://localhost:3100';
  return {
    plugins: [react()],
    server: {
      port: 5180,
      strictPort: true,
      host: true,
      proxy: { '/api': apiTarget },
    },
    preview: { port: 5180, strictPort: true },
    build: { target: 'es2020' },
  };
});
