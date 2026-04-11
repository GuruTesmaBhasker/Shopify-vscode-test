import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../assets',
    emptyOutDir: false, // Prevents deleting other Shopify assets
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        entryFileNames: 'react-customizer.js',
        chunkFileNames: 'react-customizer-[name].js',
        assetFileNames: 'react-customizer.[ext]'
      }
    }
  }
});
