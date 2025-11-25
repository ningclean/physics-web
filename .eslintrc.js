module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'off', // 关闭基础规则，使用TypeScript版本
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-prototype-builtins': 'off', // 允许使用Object.prototype方法
  },
  overrides: [
    {
      files: ['src/**/*.{js,mjs}'],
      rules: {
        'no-unused-vars': 'warn',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.min.js', '*.map'],
};