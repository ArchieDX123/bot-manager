import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' zodat de app ook vanaf een bestand (Electron) laadt.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180 },
});
