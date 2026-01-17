import { render } from 'solid-js/web';
import { logger } from './utils/logger.js';
import App from './App.jsx';
import './index.css';

const root = document.getElementById('root');

if (root) {
  logger.info('[main] rendering App into #root');
  render(() => <App />, root);
} else {
  logger.error('[main] #root element not found');
  logger.userError('Application root element not found.');
}
