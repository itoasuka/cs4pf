import "babel-polyfill";
import React from 'react';
import { Provider } from 'react-redux';

import configureStore from './store/confitureStore';
import Hello from './component/Hello.jsx';

const main = () => {
  const store = configureStore();
  return (
    <Provider store={store}>
      <Hello />
    </Provider>
  );
};

export default main;

