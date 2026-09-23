import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        home: path.resolve(__dirname, 'src/Home/home.html'),
        cart: path.resolve(__dirname, 'src/Cart/cart.html'),
      }
    }
  }
})