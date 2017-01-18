const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');

const parts = require('./webpack.parts');

const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build')
};

const common = merge(
  {
    entry: {
      app: PATHS.app
    },
    output: {
      path: PATHS.build,
      filename: '[name].js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Webpack demo'
      })
    ]
  },
  parts.lintCSS(PATHS.app),
  parts.lintJavascript(PATHS.app),
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
    port: process.env.PORT
  })
);

module.exports = function (env) {
  if (env === 'production') {
    return merge(
      common,
      {
        output: {
          chunkFilename: 'scripts/[hash].js',
          filename: '[name].[hash].js',

          // Tweak this to match your GitHub project name
          publicPath: '/survive-webpack/'
        },
        plugins: [
          new webpack.HashedModuleIdsPlugin()
        ]
      },
      parts.setFreeVariable(
        'process.env.NODE_ENV',
        'production'
      ),
      parts.extractBundles([
        {
          name: 'vendor',
          minChunks: (module, count) => {
            const userRequest = module.userRequest;

            // You can perform other similar checks here too.
            // Now we check just node_modules.
            return userRequest && userRequest.indexOf('node_modules') >= 0;
          },
          entries: ['react']
        }
      ]),
      parts.clean(PATHS.build),
      parts.generateSourcemaps('source-map'),
      parts.extractCSS(),
      parts.purifyCSS(PATHS.app)
    );
  }
  return merge(
    common,
    parts.generateSourcemaps('eval-source-map'),
    parts.loadJavascript(PATHS.app),
    parts.loadJavascript(),
    parts.loadCSS(),
    {
      // Disable performance hints during development
      performance: {
        hints: false
      },
      plugins: [
        new webpack.NamedModulesPlugin()
      ]
    }
  );
};