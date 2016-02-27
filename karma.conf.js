// Karma configuration
// Generated on Thu Feb 18 2016 08:03:01 GMT+0900 (JST)
const path = require('path');

const env = require('./env.js');
const webpackConfig = require(env.karmaWebpackConfig);

const htmlFixtures = path.join(env.testDir, 'fixtures/**/*.html');

const preprocessors = {};
preprocessors[htmlFixtures] = 'html2js';
preprocessors[env.testEntryPoint] = ['webpack', 'sourcemap'];

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'fixture', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/react/react-with-addons.js',
      'bower_components/react/react-dom.js',
      htmlFixtures,
      env.testEntryPoint
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: preprocessors,


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['nyan'],

    junitReporter: {
      outputDir: path.join(env.outputBase, 'test-reports')
    },

    coverageReporter: {
      dir: path.join(env.outputBase, 'coverage-reports'),
      reporters: [
        {
          type: 'html'
        },
        {
          type: 'cobertura',
          file: 'cobertura.xml'
        }
      ]
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: webpackConfig,

    webpackMiddleware: {
      noInfo: true
    }
  });
};
