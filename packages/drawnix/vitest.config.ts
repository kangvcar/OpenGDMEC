import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 与 tsconfig.base.json 的 paths 对齐（应用侧由 nxViteTsPaths 提供）：
      // 否则单测里任何 import '@plait-board/react-board' 的模块都解析不了
      '@plait-board/react-board': path.resolve(
        __dirname,
        '../react-board/src/index.ts'
      ),
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(
        __dirname,
        '../../node_modules/react/jsx-runtime.js'
      ),
      'react/jsx-dev-runtime': path.resolve(
        __dirname,
        '../../node_modules/react/jsx-dev-runtime.js'
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
});
