import * as types from '../constants/ActionTypes';
import {greeting} from '../util';

function setGreeting(greeting) {
  return {type: types.GREETING, greeting};
}

function storeGreetingPromise(promise) {
  return {type: types.STORE_GREETING_PROMISE, promise};
}

export function cancelGreeting() {
  return {type: types.CANCEL_GREETING};
}

export function callGreeting() {
  return (dispatch) => {
    const promise = greeting();

    dispatch(storeGreetingPromise(promise));

    promise.then((res) => {
      dispatch(setGreeting(res.greeting));
    }).catch((res) => {
      dispatch(setGreeting(res.body));
    });
  };
}
