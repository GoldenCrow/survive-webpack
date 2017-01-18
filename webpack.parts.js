const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack-plugin');

exports.devServer = function (options) {
  return {
    devServer: {
      // Enable history API fallback so HTML5 History API based
      // routing works. This is a good default that will come
      // in handy in more complicated setups.
      historyApiFallback: true,

      // Unlike the cli flag, this doesn't set
      // HotModuleReplacementPlugin!
      hot: true,

      // Display only errors to reduce the amount of output.
      stats: 'errors-only',

      // Parse host and port from env to allow customization.
      //
      // If you use Vagrant or Cloud9, set
      // host: options.host || '0.0.0.0';
      //
      // 0.0.0.0 is available to all network devices
      // unlike default `localhost`.
      host: options.host, // Defaults to `localhost`
      port: options.port // Defaults to 8080
    },
    plugins: [
      // Enable multi-pass compilation for enhanced performance
      // in larger projects. Good default.
      new webpack.HotModuleReplacementPlugin({
        // Disabled as this won't work with html-webpack-template yet
        // multiStep: true
      })
    ]
  };
};

exports.lintJavascript = function (paths) {
  return {
    module: {
      rules: [
        {
          test: /\.js$/,
          include: paths,

          use: 'eslint-loader',
          enforce: 'pre'
        }
      ]
    }
  };
};

exports.loadJS = function (paths) {
  return {
    module: {
      rules: {
        // Match files against RegExp
        test: /\.js$/,

        // Restrict matching to a directory. This
        // also accepts an array of paths.
        // Although optional, I prefer to set this for
        // JavaScript source as it helps with
        // performance and keeps the configuration cleaner.
        include: paths,

        // Apply loaders against it. These need to
        // be installed separately. In this case our
        // project would need *babel-loader*. This
        // accepts an array of loaders as well.
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: ['react', '2015']
          }
        }
      }
    }
  };
};

exports.loadCSS = function (paths) {
  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          // Restrict extraction process to the given
          // paths.
          include: paths,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        }
      ]
    }
  };
};

exports.extractBundles = function (bundles, options) {
  const entry = {};
  const names = [];

  // Set up entries and names.
  bundles.forEach(({ name, entries }) => {
    if (entries) {
      entry[name] = entries;
    }

    names.push(name);
  });

  return {
    // Define an entry point needed for splitting.
    entry,
    plugins: [
      // Extract bundles.
      new webpack.optimize.CommonsChunkPlugin(
        Object.assign({}, options, { names })
      )
    ]
  };
};

exports.extractCSS = function (paths) {
  return {
    module: {
      rules: [
        // Extract CSS during build
        {
          test: /\.css$/,
          // Restrict extraction process to the given
          // path.
          include: paths,

          loader: ExtractTextPlugin.extract({
            fallbackLoader: 'style-loader',
            loader: 'css-loader!postcss-loader'
          })
        }
      ]
    },
    plugins: [
      // Output extracted CSS to a file
      new ExtractTextPlugin('[name].css')
    ]
  };
};

exports.purifyCSS = function (paths) {
  paths = Array.isArray(paths) ? paths : [paths];

  return {
    plugins: [
      new PurifyCSSPlugin({
        // Our paths are absolute so Purify needs patching
        // against that to work.
        basePath: '/',
        // `paths` is used to point PurifyCSS to files not
        // visible to Webpack. This expects glob patterns so
        // we adapt here.
        paths: paths.map(path => `${path}/*`),
        purifyOptions: {
          info: true
        },
        // Walk through only html files within node_modules. It
        // picks up .js files by default!
        resolveExtensions: ['.html']
      })
    ]
  };
};

exports.lintCSS = function (paths) {
  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          include: paths,
          use: 'postcss-loader',
          enforce: 'pre'
        }
      ]
    }
  };
};

exports.urlLoader = function (paths) {
  return {
    module: {
      test: /\.(jpg|png)$/,
      loader: 'url-loader',
      include: paths,
      options: {
        limit: 25000
      }
    }
  };
};

exports.loadImage = function (paths) {
  return {
    modules: {
      test: /\.(jpg|png)$/,
      loader: 'file-loader',
      include: paths,
      options: {
        name: '[path][name].[hash].[ext]'
      }
    }
  };
};

exports.loadSVG = function (paths) {
  return {
    modules: {
      rules: {
        test: /\.svg$/,
        use: 'file-loader',
        include: paths
      }
    }
  };
};

exports.loadFonts = function (options) {
  const name = (options && options.name) || 'fonts/[hash].[ext]';
  return {
    module: {
      rules: [{
        // Capture eot, ttf, svg, woff, and woff2
        test: /\.(eot|ttf|svg|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
        options: {
          name: name
        }
      }]
    }
  };
};

exports.generateSourcemaps = function (options) {
  const {
    test,
    include,
    separateSourcemaps,
    columnMappings } = options;

  // Enabe functionality as you want to expose it
  return {
    plugins: [
      new webpack.SourceMapDevToolPlugin({
        // Match assets just like for loader.
        test: test, // string | RegExp | Array,
        include: include, // string | RegExp | Array,

        // `exclude` matches file names, not package names!
        // exclude: string | RegExp | Array,

        // If filename is set, output to this file.
        // See `sourceMapFileName`.
        // filename: string,

        // This line is appended to the original asset processed.
        // For instance '[url]' would get replaced with an url
        // to the sourcemap.
        // append: false | string,

        // See `devtoolModuleFilenameTemplate` for specifics.
        // moduleFilenameTemplate: string,
        // fallbackModuleFilenameTemplate: string,

        // If false, separate sourcemaps aren't generated.
        module: separateSourcemaps,

        // If false, column mapppings aren't generated.
        columns: columnMappings,

        // Use simpler line to line mappings for the matched modules.
        // lineToLine: bool | {test, include, exclude},

        // Remove source content from sourcemaps. This is useful
        // especially if your sourcemaps are very big (over 10MB)
        // as browsers can struggle with those.
        // See https://github.com/webpack/webpack/issues/2669.
        // noSources: bool
      })
    ]
  };
};