// craco.config.js
const RemoveConsolePlugin = require('craco-plugin-remove-console');

module.exports = {
  plugins: [
    {
      plugin: RemoveConsolePlugin,
      options: {
        exclude: ['error', 'warn'], // Mantém console.error e console.warn
      },
    },
  ],
};