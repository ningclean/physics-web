import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['src/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        MediaRecorder: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        ResizeObserver: 'readonly',
        NodeFilter: 'readonly'
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-prototype-builtins': 'off' // 允许使用Object.prototype方法
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.min.js',
      '*.map',
      'src/**/*.ts' // 暂时忽略TypeScript文件
    ]
  }
];