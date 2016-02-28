const path = require('path');
const webpack = require('webpack');

const env = require('./env.js');

module.exports = {
  entry: {
    app: [path.join(env.webpackBase, 'index.js')]
  },
  output: {
    path: env.distAssetsDir,
    publicPath: '/assets/',
    filename: 'bundle.js'
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-addons-test-utils': 'React.addons.TestUtils'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  cache: true,
  debug: true,
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({'__DEV__': true}),
    new webpack.ProvidePlugin({
      'Promise': 'bluebird'
    }),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    preLoaders: [
      {
        test: /\.jsx?/,
        exclude: [
          env.nodeModules,
          env.testDir
        ],
        loader: 'eslint-loader'
      }
    ],
    loaders: [
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
      },
      {
        test: /\.jsx?$/,
        exclude: [
          env.nodeModules
        ],
        loader: 'babel'
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },
  node:  {
    fs: 'empty'
  }
};
