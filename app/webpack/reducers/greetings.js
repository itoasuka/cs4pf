import * as types from '../constants/ActionTypes';

const initialState = {
  greeting: 'おまちください',
  promise: null
};

export default function greetings(state = initialState, action) {
  switch (action.type) {
    case types.GREETING:
      return Object.assign({}, state, {
        greeting: action.greeting,
        promise: null
      });
    case types.STORE_GREETING_PROMISE:
      return Object.assign({}, state, {
        promise: action.promise
      });
    case types.CANCEL_GREETING:
      if (state.promise) {
        state.promise.cancel();
      }
      return Object.assign({}, state, {
        promise: null
      });
    default:
      return state;
  }
}
