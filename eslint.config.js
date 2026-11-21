// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // scripts/ 是在电脑上跑的 Node 脚本（生成图标和商店截图），不是 App 代码
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', Buffer: 'readonly', URL: 'readonly', process: 'readonly' },
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
