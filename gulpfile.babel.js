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

import env from './env.js';

const $ = gulpLoadPlugins();

/**
 * 出荷用アセットファイルを全て指定するためのもの
 *
 * @type {string}
 */
const allDistAssets = path.join(env.distAssetsDir, '**/*');

const args = minimist(process.argv.slice(2));

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
 * webpack-dev-server を起動する
 */
gulp.task('webpack-dev-server', () => {
  const WebpackDevServer = require('webpack-dev-server');
  const config = require(env.webpackConfig);
  const compiler = webpack(config);

  new WebpackDevServer(compiler, {
    publicPath: config.output.publicPath,
    stats: {
      colors: true
    },
    contentBase: (args.play) ? 'http://localhost:9000' : env.outputBase,
    proxy: {
      '/0/*': {
        target: `http://localhost:${env.serverPort}/`,
        secure: false
      }
    }
  }).listen(env.webpackDevServerPort, '0.0.0.0', (err) => {
    if(err) throw new $.util.PluginError('webpack-dev-server', err);

    $.util.log('[webpack-dev-server]', `http://localhost:${(args.play) ? env.serverPort : env.webpackDevServerPort}/`);
  });
});

/*
 * リソース監視を開始する。
 */
(function () {
  const dep = ['webpack-dev-server', 'sass:watch', 'bower'];
  if (!args.play) {
    dep.push('html:watch', 'json-server');
  }
  gulp.task('watch', dep);
}());

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
  runSequence(['webpack', 'sass', 'html', 'bower'], 'md5', 'gzip', cb);
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
 * SASS で処理を行う。
 */
gulp.task('sass', () => {
  return gulp.src(env.sassSrc)
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer('last 2 version'))
    .pipe($.cssnano())
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(env.distAssetsDir));
});

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
    .pipe(gulp.dest(env.outputBase));
});

/*
 * HTML の監視を行う。
 */
gulp.task('html:watch', ['html'], () => {
  gulp.watch(env.htmlSrc, ['html']);
});

/*
 * bower を配置する。
 */
gulp.task('bower', () => {
  return gulp.src('bower_components/**/*')
    .pipe(gulp.dest(path.join(env.outputBase, '/bower_components/')));
});