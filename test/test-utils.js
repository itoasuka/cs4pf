/*
 * テスト用ユーティリティを提供する。
 */

/**
 * 後回しでテストを行う。
 *
 * @param {function} testFunc テストを行う関数
 * @return {Promise} 後回しテストの Promise
 */
export function deferTest(testFunc) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        testFunc();
      } catch (e) {
        reject(e);
        return;
      }

      resolve();
    }, 0);
  });
}
