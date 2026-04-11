import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('react-customizer-root');

if (rootElement) {
  // Grab the Variant ID and Customizer Image from the element's data attributes
  const variantId = rootElement.getAttribute('data-variant-id') || null;
  const mockupUrl = rootElement.getAttribute('data-mockup-url') || null;

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App baseVariantId={variantId} customMockupUrl={mockupUrl} />
    </React.StrictMode>
  );
}
