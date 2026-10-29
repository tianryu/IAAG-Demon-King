import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{emptyOutDir:true,sourcemap:false,chunkSizeWarningLimit:1600},server:{port:5173,strictPort:true}});
