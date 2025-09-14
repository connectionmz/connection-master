// config-overrides.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function override(config, env) {
  // Sua configuração atual para crypto fallback
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
  };

  // Adicionar otimizações para produção
  if (env === 'production') {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,    // Remove console.log em produção
              drop_debugger: true,   // Remove debugger
              pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove consoles específicos
            },
            mangle: {
              toplevel: true,        // Ofusca variáveis de nível superior
            },
            output: {
              comments: false,       // Remove comentários
              beautify: false,       // Não formata o código
            },
          },
          extractComments: false,    // Não extrai comentários para arquivos separados
        }),
      ],
    };

    // Otimizações adicionais do Webpack
    config.performance = {
      ...config.performance,
      hints: 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };
  }

  return config;
};