const webpackConfig = Object.assign({}, require('./webpack.config.js'));

// Karmaで使わない（参照してはいけない）項目を削除
Reflect.deleteProperty(webpackConfig, 'entry');
Reflect.deleteProperty(webpackConfig, 'output');
webpackConfig.devtool = 'inline-source-map';

module.exports = webpackConfig;

