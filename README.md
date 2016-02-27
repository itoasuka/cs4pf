Client Side for Play Framework
==============================

　このプロジェクトは[Play Framework](https://www.playframework.com/)によるWebアプリケーションのクライアントサイド開発に便利なように調整されたNode.jsベースのプロジェクトです。


コンセプト
---------

* ビルドツールとして[gulp.js](http://gulpjs.com/)を使用する。
* リソースをまとめるのに[webpack](https://webpack.github.io/)を使用する。
* [Bower](http://bower.io/)で取得でき、それを使用しても問題がないライブラリはそちらを優先し、Webpackのビルドに含めずにビルドコストを低減する。
* AltJSにECMAScript 2015を使用し、[Babel](https://babeljs.io/)で処理する（実際はWebpackのbabel-loaderで行う）。
* スタイルシート言語に[SASS](http://sass-lang.com/)を使用する。Webpackに統合する場合も同様。
* テストは[Karma](https://karma-runner.github.io/)、[Chai](http://chaijs.com/)、[power-assert](https://github.com/power-assert-js/power-assert)の組み合わせで行う。カバレッジも取得する。
* コーディングスタイルを[ESLint](http://eslint.org/)でチェックする。
* テスト結果はJUnit互換、カバレッジ網羅率はCobertura互換、コーディングスタイルチェック結果はCheckstyle互換のそれぞれの形式で保存し、Jenkins等で利用できるようにする。
* 開発中の実行についてPlay Frameworkと連携することも単独で稼働することもできる。


サンプルコードについて
----------------------

* [React](https://facebook.github.io/react/)によるSPAを想定する。
* Flux実装に[Redux](http://redux.js.org/)を使用する。
* Promiseの実装には[bluebird](http://bluebirdjs.com/)を使用する。
* Ajax通信には[SuperAgent](http://visionmedia.github.io/superagent/)および[superagent-bluebird-promise](https://github.com/KyleAMathews/superagent-bluebird-promise)を使用する。


Getting Started
---------------

まずはgulpとbowerをインストールします。詳しくはそれぞれの公式サイト等を参照してください。

    npm install -g gulp
 
    npm install -g bower

npmとbowerで依存ライブラリをインストールします。

    npm install

    bower install


ファイル構成
------------

    ├── .babelrc                              # Babelの設定
    ├── .eslintrc.json                        # ESLintの設定
    ├── .gitignore                            # Gitの除外設定
    ├── .tern-project                         # ternjsのプロジェクトファイル
    ├── README.md                             # このファイル
    ├── app/                                  # 各種ソースコード置き場
    │   ├── index.html                        # 単独モードで起動する際の初期ページ
    │   ├── sass/                             # SASSソースコード置き場
    │   └── webpack/                          # webpackでひとまとめにするあらゆるリソースの置き場
    │       └── index.js                      # webpackでひとまとめにするリソースのエントリポイント
    ├── bower.json                            # Bowerの設定
    ├── build/                                # ビルド結果置き場
    │   └── assets/                           # Play Frameworkから参照されるファイルの置き場
    ├── db.json                               # json-serverで配信するJSONの設定ファイル
    ├── env.js                                # 各設定ファイルから参照されるメタ設定ファイル
    ├── gulpfile.babel.js                     # Gulpのタスクを定義するファイル
    ├── karma.conf.js                         # Karmaの定義ファイル
    ├── karma.webpack.config.js               # Karma内で使用するWebpackの設定ファイル
    ├── package.json                          # npmの設定ファイル
    ├── test/                                 # テストコード置き場
    │   └── fixtures/                         # フィクスチャ置き場
    └── webpack.config.js                     # Webpackの設定ファイル


Gulpタスク
----------

|タスク名      |説明                                                                                             |
|--------------|-------------------------------------------------------------------------------------------------|
|clean         |buildディレクトリを削除する。                                                                    |
|build         |プロダクト用のファイルを生成す。                                                                 |
|watch         |監視モードで起動し、開発用Webサーバを起動する。`--play`をつけるとPlay Framework連動モードになる。|
|test          |テストを実行する。                                                                               |
|karma:watch   |監視モードでkarmaを起動し、ソースコードを改変する度にテストを実行する。                          |
|eslint        |eslintによるコーディングスタイルチェックを行い、Checkstyle互換形式でレポートを出力する。         |
|sass          |sassの処理のみ行う。                                                                             |


開発用Webサーバ
---------------

`gulp watch` で開発用Webサーバが起動します。[http://localhost:8080/](http://localhost:8080/)にアクセスしてください。
このとき表示されるページは `app/index.html` です。開発用Webサーバと同時に [JSON Server](https://github.com/typicode/json-server)
によるモック Web API サーバが起動します。これにり、サーバサイドの開発進捗にあまり影響されること無くクライアントサイドの開発をすすめることが可能です。


テスト
------

テストは `gulp test` で起動し、[Karma](https://karma-runner.github.io/)を使用して、FirefoxとChromeを用いたテストを行います。
`gulp karma:watch` で起動するとソースコードの監視を開始し、ソースコード（プロダクトコードおよびテストコード）に変更があるたびに自動的にテストが実行されます。


Jenkinsでの設定
---------------

このプロジェクトは[Jenkins](https://jenkins-ci.org/)での運用を念頭に置いています。

### レポートの設定

`gulp test` および `gulp eslint` を実行すると各レポートファイルが出力され、それをJenkinsで扱うこともできます。

|ビルド後の後処理                    |対象項目                     |設定値                              |
|------------------------------------|-----------------------------|------------------------------------|
|JUnitテスト結果の集計               |テスト結果XML                |`build/test-reports/**/*.xml`       |
|Cobertura カバレッジ・レポートの集計|Cobertura XMLレポートパターン|`build/coverage-reports/**/*.xml`   |
|Checkstyle警告の集計                |集計するファイル             |`build/eslint/checkstyle-result.xml`|

