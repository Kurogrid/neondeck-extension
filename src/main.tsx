import { render } from 'preact';
import './theme/tokens.css';
import './styles/app.css';
import './theme/theme.css';
import './theme/effects.css';
import { App } from './app';

render(<App />, document.getElementById('app')!);
