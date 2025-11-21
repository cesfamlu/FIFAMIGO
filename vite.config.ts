import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // PASO 2: Agregamos la base para GitHub Pages. 
      // IMPORTANTE: Cambia 'nombre-de-tu-repo' por el nombre exacto de tu repositorio (ej: '/fifa-tracker/')
      base: '/FIFAMIGO/', 

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Nota: Al tener este 'define', tu código anterior con process.env seguirá funcionando 
      // sin que tengas que cambiarlo a import.meta.env. ¡Bien jugado!
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path