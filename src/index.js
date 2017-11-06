import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './normalize.css';
import './index.css';
import RSVPApp from './my_modules/rsvp.js';

class App extends Component {
  render () {
    return (
      <RSVPApp></RSVPApp>
    );
  }
}

ReactDOM.render((
    <App />
), document.getElementById('root'));
