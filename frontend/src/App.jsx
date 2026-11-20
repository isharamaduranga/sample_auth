import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const LOCAL_API = API_URL.startsWith('http://localhost:') || API_URL.startsWith('http://127.0.0.1:');

function validate(values, mode) {
  const errors = {};
  if (mode === 'signup' && !values.name.trim()) errors.name = 'Name is required.';
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email.';
  if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (mode === 'signup' && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function App() {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      ...(LOCAL_API ? { targetAddressSpace: 'loopback' } : {}),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired');
        return response.json();
      })
      .then((data) => setUser({ name: data.name, email: data.email }))
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setMessage('');
  }

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    const nextErrors = validate(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const endpoint = mode === 'signup' ? 'auth/signup' : 'auth/login';
      const payload = mode === 'signup'
        ? { name: values.name.trim(), email: values.email.trim(), password: values.password }
        : { email: values.email.trim(), password: values.password };
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...(LOCAL_API ? { targetAddressSpace: 'loopback' } : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');

      if (mode === 'signup') {
        // Signup creates the account, but the user must log in explicitly afterward.
        setMode('login');
        setErrors({});
        setValues({ name: '', email: values.email.trim(), password: '', confirmPassword: '' });
        setMessage(data.message || 'Signup successful! Please log in with your new account.');
        return;
      }

      localStorage.setItem('authUser', JSON.stringify({ name: data.name, email: data.email }));
      localStorage.setItem('authToken', data.token);
      setUser({ name: data.name, email: data.email });
      setMessage('Welcome back!');
    } catch (error) {
      setMessage(error.message || 'Could not connect to the server.');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setValues({ name: '', email: '', password: '', confirmPassword: '' });
    setMessage('You have signed out.');
  }

  if (checkingSession) {
    return <main className="page-shell"><header className="brand"><span className="brand-mark">S</span><span>Simple Auth</span></header><p className="subtitle">Checking your session…</p></main>;
  }

  if (user) {
    return (
      <main className="page-shell">
        <header className="brand"><span className="brand-mark">S</span><span>Simple Auth</span></header>
        <section className="card welcome-card">
          <div className="success-icon">✓</div>
          <p className="eyebrow">AUTHENTICATED</p>
          <h1>Welcome, {user.name}.</h1>
          <p className="subtitle">You are signed in as <strong>{user.email}</strong>.</p>
          <button className="primary-button" onClick={logout}>Sign out</button>
        </section>
        <footer>React · Spring Boot · MySQL</footer>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="brand"><span className="brand-mark">S</span><span>Simple Auth</span></header>
      <section className="card">
        <div className="tabs" role="tablist" aria-label="Authentication">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => switchMode('login')} role="tab" aria-selected={mode === 'login'}>Log in</button>
          <button className={mode === 'signup' ? 'tab active' : 'tab'} onClick={() => switchMode('signup')} role="tab" aria-selected={mode === 'signup'}>Create account</button>
        </div>
        <div className="card-content">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>{mode === 'login' ? 'Welcome back' : 'Get started'}</h1>
          <p className="subtitle">{mode === 'login' ? 'Enter your details to sign in.' : 'Create an account in a few seconds.'}</p>

          <form onSubmit={submit} noValidate>
            {mode === 'signup' && <Field label="Full name" name="name" value={values.name} onChange={update} error={errors.name} placeholder="e.g. Alex Morgan" autoComplete="name" />}
            <Field label="Email address" name="email" value={values.email} onChange={update} error={errors.email} placeholder="you@example.com" type="email" autoComplete="email" />
            <Field label="Password" name="password" value={values.password} onChange={update} error={errors.password} placeholder="At least 8 characters" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'signup' && <Field label="Confirm password" name="confirmPassword" value={values.confirmPassword} onChange={update} error={errors.confirmPassword} placeholder="Enter password again" type="password" autoComplete="new-password" />}
            {message && <p className={message.startsWith('Could not') || message.includes('failed') || message.includes('already') ? 'notice error-notice' : 'notice'} role="status">{message}</p>}
            <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'} <span aria-hidden="true">→</span></button>
          </form>
          <p className="switch-prompt">{mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
            <button className="text-button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create an account' : 'Log in'}</button>
          </p>
        </div>
      </section>
      <footer>React · Spring Boot · MySQL</footer>
    </main>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', ...props }) {
  const id = `field-${name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} value={value} onChange={onChange} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <small id={`${id}-error`} className="field-error">{error}</small>}
    </div>
  );
}
