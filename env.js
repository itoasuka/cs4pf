/*
 * 各ファイルパスの設定
 */
const path = require('path');

const env = {};

/** 
 * 入力ファイルのベース 
 *
 * @type {string}
 */
env.inputBase = path.resolve(__dirname, 'app');

/**
 * 出力ファイルのベース
 *
 * @type {string}
 */
env.outputBase = path.resolve(__dirname, 'build');

/**
 * Webpack でひとつに固めるソースの置き場
 *
 * Webpack でまとめられるものならばなんでも置きます。
 *
 * @type {string}
 */
env.webpackBase = path.resolve(env.inputBase, 'webpack');

/**
 * Webpack の処理対象のすべてのファイル
 */
env.webpackAll = path.resolve(env.webpackBase, '**/*');

/**
 * Webpack で扱う JavaScript ファイル
 *
 * @type {array}
 */
env.webpackJs = [
  path.join(env.webpackBase, '**/*.js'),
  path.join(env.webpackBase, '**/*.jsx')
];

/**
 * SASS で処理するソース
 *
 * @type {string}
 */
env.sassSrc = path.resolve(env.inputBase, 'sass/**/*.+(scss|sass)');

/**
 * HTML ソース
 *
 * @type {string}
 */
env.htmlSrc = path.resolve(env.inputBase, '**/*.html');

/**
 * 画像ソース
 *
 * @type {string}
 */
env.imageSrc = path.resolve(env.inputBase, '**/*.+(jpg|jpeg|png|gif|svg)');

/**
 * テストコードの置き場
 *
 * @type {string}
 */
env.testDir = path.resolve(__dirname, 'test');

/**
 * テストのエントリポイント
 * 
 * @type {string}
 */
env.testEntryPoint = path.join(env.testDir, 'test_index.js');

/**
 * Webpack の設定ファイルのパス
 *
 * @type {string}
 */
env.webpackConfig = path.resolve(__dirname, 'webpack.config.js');

/**
 * Karma 用 Webpack 設定ファイルのパス
 *
 * @type {string}
 */
env.karmaWebpackConfig = path.resolve(__dirname, 'karma.webpack.config.js');

/**
 * Karma の設定ファイルのパス
 *
 * @type {string}
 */
env.karmaConfig = path.resolve(__dirname, 'karma.conf.js');

/**
 * 処理済みアセット（配布用アセット）の置き場
 *
 * @type {string}
 */
env.distAssetsDir = path.resolve(env.outputBase, 'assets');

/**
 * node モジュールの置き場
 *
 * @type {string}
 */
env.nodeModules = path.resolve(__dirname, 'node_modules');

/**
 * browser-sync のポート番号
 *
 * @type {number}
 */
env.browserSyncPort = 3000;

/**
 * 開発用サーバサイドのポート番号
 *
 * @type {number}
 */
env.serverPort = 9000;

/**
 * Web API パスのプレフィックス
 * 
 * @type {string}
 */
env.webApiPrefix = '/0';

module.exports = env;
