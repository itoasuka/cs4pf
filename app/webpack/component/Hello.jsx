import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import {callGreeting, cancelGreeting} from '../actions';

class Hello extends React.Component {
  static get displayName() {
    return 'Hello';
  }

  static get propTypes() {
    return {
      dispatch: PropTypes.func.isRequired,
      greetings: PropTypes.shape({
        greeting: PropTypes.string
      })
    };
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.dispatch(callGreeting());
  }

  componentWillUnmount() {
    this.props.dispatch(cancelGreeting());
  }

  render() {
    return (
      <div>{this.props.greetings.greeting}</div>
    );
  }
}

export default connect((state) => ({
  greetings: state.greetings
}))(Hello);
