import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import assert from 'power-assert';

import { deferTest } from './test-utils.js';
import main from '../app/webpack/main.jsx';

describe('main', () => {

  const head = {
    'Content-Type': 'application/json'
  };

  let server;

  before(() => {
    server = sinon.fakeServer.create();
  });
    
  after(() => {
    server.restore();
    server = null;
  });

  it('あいさつをする', () => {
    const body = JSON.stringify({
      greeting: 'こんにちは、世界！'
    });

    server.respondWith('GET', /\/0\/greeting$/, [ 200, head, body ]);

    const rendered = TestUtils.renderIntoDocument(main());
    const elem = TestUtils.scryRenderedDOMComponentsWithTag(rendered, 'div');
    assert(elem.length === 1);
    assert(elem[0].textContent === 'おまちください');

    server.respond();

    return deferTest(() => {
      const elem = TestUtils.scryRenderedDOMComponentsWithTag(rendered, 'div');
      assert(elem.length === 1);
      assert(elem[0].textContent === 'こんにちは、世界！');

      assert(rendered.store.getState().greetings.promise === null);

      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(rendered).parentNode);  

      assert(rendered.store.getState().greetings.promise === null);
    });
  });
  it('あいさつをあきらめる', () => {
    const rendered = TestUtils.renderIntoDocument(main());
    assert(rendered.store.getState().greetings.promise !== null);

    const spy = sinon.spy(rendered.store.getState().greetings.promise, "cancel");
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(rendered).parentNode);  

    assert(spy.calledOnce);
    
    return deferTest(() => {
      assert(rendered.store.getState().greetings.promise === null);
    });
  });
  it('あいさつがない', () => {
    const body = JSON.stringify('見つからない、世界！');

    server.respondWith('GET', /\/0\/greeting/, [ 404, head, body ]);

    const rendered = TestUtils.renderIntoDocument(main());
    const elem = TestUtils.scryRenderedDOMComponentsWithTag(rendered, 'div');
    assert(elem.length === 1);
    assert(elem[0].textContent === 'おまちください');

    server.respond();

    return deferTest(() => {
      const elem = TestUtils.scryRenderedDOMComponentsWithTag(rendered, 'div');
      assert(elem.length === 1);
      assert(elem[0].textContent === '見つからない、世界！');

      assert(rendered.store.getState().greetings.promise === null);

      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(rendered).parentNode);  

      assert(rendered.store.getState().greetings.promise === null);
    });
  });
});
