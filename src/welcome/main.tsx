import { render } from 'preact';
import '../theme/tokens.css';
import '../styles/app.css';
import '../theme/theme.css';
import './welcome.css';
import { Welcome } from './Welcome';

render(<Welcome />, document.getElementById('app')!);
