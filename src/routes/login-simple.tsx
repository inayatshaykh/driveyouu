import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login-simple')({
  component: SimpleLogin,
});

function SimpleLogin() {
  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Simple Login Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>Mobile Number:</label>
        <input
          type="text"
          placeholder="Enter mobile"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>OTP:</label>
        <input
          type="text"
          placeholder="Enter OTP"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
      </div>

      <button
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Login
      </button>

      <p style={{ marginTop: '20px', color: '#666' }}>
        If this page works, the issue is in the complex login component.
        If this page also freezes, the issue is global (CSS, router, or browser).
      </p>
    </div>
  );
}
