import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function ReactDiagnostic() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Kcal React diagnostic</h1>
      <p>React mounted successfully.</p>
      <button type="button" onClick={() => alert('React click works')}>
        Click test
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactDiagnostic />
  </StrictMode>
);
