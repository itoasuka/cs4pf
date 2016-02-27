import request from 'superagent-bluebird-promise';

export function greeting() {
  return request
    .get('/0/greeting')
    .then((response) => {
      return JSON.parse(response.text);
    });
}
