import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

/**
 * Vite 설정 템플릿
 *
 * 사용법:
 * 1. 이 파일을 프로젝트 루트에 복사
 * 2. 프록시 설정을 프로젝트에 맞게 수정
 *
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      TanStackRouterVite(), // TanStack Router 파일 기반 라우팅
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './fe-shared-packages/packages'),
      },
    },
    server: {
      port: 3000,
      host: true, // 네트워크에서 접근 가능
      cors: true,
      proxy: {
        // Spring 백엔드 프록시
        '/api-spring': {
          target: env.VITE_API_URL_SPRING || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-spring/, ''),
        },
        // NestJS 백엔드 프록시
        '/api-nest': {
          target: env.VITE_API_URL_NEST || 'http://localhost:4001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-nest/, ''),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['@tanstack/react-router'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});
