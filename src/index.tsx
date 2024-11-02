import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './CSS/main.css';
import './CSS/normolize.css';
import { AuthProvider } from './store';
// import '../node_modules/antd/dist/antd.css';
import { App } from './App';

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
} else {
  console.error('Root container not found');
}
