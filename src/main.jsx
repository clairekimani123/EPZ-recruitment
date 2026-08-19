import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// --------------------------------------------------------------------------
// This is the piece Next.js used to hide from you: SOMETHING has to take
// your React components and actually put them on the page. This file is
// that something. ReactDOM.createRoot().render() finds the <div id="root">
// in index.html and mounts your whole app inside it.
//
// BrowserRouter enables react-router-dom, giving us multiple "pages"
// (/apply, /admin) inside what is technically still a single HTML page —
// this is what people mean by "SPA" (Single Page Application). Next.js's
// file-based routing was doing something conceptually similar for you
// automatically; here you set it up explicitly in App.jsx.
// --------------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);