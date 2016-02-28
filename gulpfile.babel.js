import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import gutil from 'gulp-util';
import webpack from 'webpack';
import runSequence from 'run-sequence';
import karma from 'karma';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import jsonServer from 'json-server';
import minimist from 'minimist';
import browserSync from 'browser-sync';
import stripAnsi from 'strip-ansi';
import url from 'url';

import env from './env.js';

const $ = gulpLoadPlugins();

/**
 * 出荷用アセットファイルを全て指定するためのもの
 *
 * @type {string}
 */
const allDistAssets = path.join(env.distAssetsDir, '**/*');

const args = minimist(process.argv.slice(2));

const browserSyncServer = browserSync.create();

/**
 * md5 ファイルを作成するストリームを返します。
 *
 * @return {Writable} ストリーム 
 */
function md5() {
  const through2 = require('through2');
  const crypto = require('crypto');

  return through2.obj(function (file, enc, cb) {
    const stream = crypto.createHash("md5");
    file.pipe(stream);
    const hash = stream.read().toString('hex');
    const hashfile = new gutil.File({
      cwd: file.cwd,
      base: file.base,
      path: `${file.path}.md5`,
      contents: new Buffer(hash)
    });
    this.push(hashfile);
    cb();
  });
}

/*
 * 出力ディレクトリを削除する
 */
gulp.task('clean', del.bind(null, [env.outputBase]));

/*
 * browser-sync を起動する
 */
gulp.task('browser-sync', () => {
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackConfig = require(env.webpackConfig);
  const bundler = webpack(webpackConfig);
  bundler.plugin('done', (stats) => {
    if (stats.hasErrors() || stats.hasWarnings()) {
      return browserSync.sockets.emit('fullscreen:message', {
        title: "Webpack Error:",
        body:  stripAnsi(stats.toString()),
        timeout: 100000
      });
    }
    browserSync.reload();
  });

  const proxy = require('proxy-middleware');
  const proxyOptions = url.parse(`http://localhost:${env.serverPort}${env.webApiPrefix}`);
  proxyOptions.route = env.webApiPrefix;
  const config = {
    port: env.browserSyncPort,
    open: false,
    logFileChanges: false,
    middleware: [
      proxy(proxyOptions),
      webpackDevMiddleware(bundler, {
        publicPath: webpackConfig.output.publicPath,
        stats: {colors: true}
      })
    ],
    plugins: ['bs-fullscreen-message'],
    files: [
      path.join(env.webpackBase, '**/*')
    ]
  };
  
  if (args.play) {
    config.proxy = `localhost:${env.serverPort}`;
  } else {
    config.server = {
      baseDir: env.outputBase,
      routes: {
        "/bower_components": "bower_components"
      }
    };
  }
  browserSyncServer.init(config);
});

/*
 * リソース監視を開始する。
 */
gulp.task('watch', () => {
  const dep = ['sass:watch'];
  if (!args.play) {
    dep.push('html:watch', 'json-server');
  }
  runSequence('clean', dep, 'browser-sync');
});

/*
 * Webpack でリソースをまとめる。
 *
 * ソースの最適化なども行い出荷品質にする。
 */
gulp.task('webpack', (cb) => {
  const config = require(env.webpackConfig);
  config.plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      '__DEV__': false
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.ProvidePlugin({
      'Promise': 'bluebird'
    })
  ];

  webpack(config, (err, stats) => {
    if(err) throw new $.util.PluginError("webpack", err);
    $.util.log("[webpack]", stats.toString({
      colors: true
    }));
    cb();
  });
});

/*
 * .md5 ファイルを作る。
 */
gulp.task('md5', () => {
  return gulp.src([allDistAssets, `!${path.join(env.distAssetsDir, '**/*.gz')}`])
    .pipe(md5())
    .pipe(gulp.dest(env.distAssetsDir));
});

/*
 * .gz ファイルを作る。
 */
gulp.task('gzip', () => {
  return gulp.src([allDistAssets, `!${path.join(env.distAssetsDir, '**/*.md5')}`])
    .pipe($.gzip())
    .pipe(gulp.dest(env.distAssetsDir));
});

/*
 * すべてのリソースを処理して出荷品質にする。
 */
gulp.task('build', ['clean'], (cb) => {
  runSequence(['webpack', 'sass'], 'md5', 'gzip', cb);
});

/*
 * Karma によるテストを行う。
 */
gulp.task('karma', (cb) => {
  const config = Object.assign({}, require(env.karmaWebpackConfig));
  // できるだけプロダクトコードに近い状態でテストを行う
  config.plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      '__DEV__': false
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.ProvidePlugin({
      'Promise': 'bluebird'
    })
  ];
  config.isparta = {
    embedSource: true,
    noAutoWrap: true
  };
  // eslint は実行しない。eslint タスクを使用すること。
  config.module.preLoaders = config.module.preLoaders.filter((e) => e.loader !== 'eslint-loader'); 
  // ナマ babel を適用するのはテストコードのみ
  config.module.loaders = config.module.loaders.map((e) => {
    if (e.loader === 'babel') {
      e.exclude = e.exclude || [];
      e.exclude.push(env.webpackBase);
    }

    return e;
  });
  // プロダクトコードには isparta を使用してカバレッジ用の変換をかける
  config.module.loaders.push({
    test: /\.jsx?/,
    include: env.webpackBase,
    loader: 'isparta'
  });

  new karma.Server({
    configFile: env.karmaConfig,
    autoWatch: false,
    singleRun: true,
    reporters: ['nyan', 'coverage', 'junit'],
    colors: true,
    webpack: config
  }, cb).start();
});

/*
 * Karma を実行しソースの監視を行う。
 */
gulp.task('karma:watch', (cb) => {
  new karma.Server({
    configFile: env.karmaConfig,
    singleRun: false,
    colors: true
  }, cb).start();
});

/*
 * karma タスクのエイリアス
 */
gulp.task('test', ['karma']);

/*
 * karma:watch タスクのエイリアス
 */
gulp.task('test:watch', ['karma:watch']);

/*
 * eslint で書式チェックを行う。
 */
gulp.task('eslint', () => {
  const distDir = path.join(env.outputBase, 'eslint');
  mkdirp.sync(distDir);

  return gulp.src(env.webpackJs)
    .pipe($.eslint())
    .pipe($.eslint.format('checkstyle', fs.createWriteStream(path.join(distDir, 'checkstyle-result.xml'))));
});

/*
 * eslint タスクのエイリアス
 */
gulp.task('checkstyle', ['eslint']);

/*
 * SASS で処理を行う。
 */
gulp.task('sass', () => {
  const config = require('./webpack.config');

  return gulp.src(env.sassSrc)
    .pipe($.cached('sass'))
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(config.postcss()))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(env.distAssetsDir))
    .pipe(browserSyncServer.stream());
});

/*
 * sass タスクのエイリアス
 */
gulp.task('css', ['sass']);

/*
 * SASS 対象リソースの監視を行う。
 */
gulp.task('sass:watch', ['sass'], () => {
  gulp.watch(env.sassSrc, ['sass']);
});

/*
 * モック API サーバを起動する。
 */
gulp.task('json-server', () => {
  const server = jsonServer.create();
  server.use(jsonServer.defaults());
  
  const router = jsonServer.router('db.json');
  server.use(router);

  server.listen(env.serverPort);
});

/*
 * HTML を移動する（webpack-dev-serverで参照するため）
 */
gulp.task('html', () => {
  return gulp.src(env.htmlSrc)
    .pipe($.changed(env.outputBase))
    .pipe(gulp.dest(env.outputBase))
    .pipe(browserSyncServer.stream());
});

/*
 * HTML の監視を行う。
 */
gulp.task('html:watch', ['html'], () => {
  gulp.watch(env.htmlSrc, ['html']);
});
