import React, { useEffect, useRef, useState } from 'react';
import { authClient } from '../services/auth/authClient';
import styles from './LoginView.module.css';

interface LoginViewProps {
  onLoginSuccess: (
    token: string,
    studentId: string,
    name: string
  ) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  async function doLogin(
    emailVal: string,
    passwordVal: string
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await authClient.login(emailVal, passwordVal);

      console.info('[LoginView] login response:', response);

      const token = response?.accessToken;
      const studentId = response?.studentId || response?.student?.id || response?.user?.id;
      let studentName = response?.name || response?.student?.name || response?.user?.email || '';

      if (!token || !studentId) {
        throw new Error('Respuesta de autenticaci\u00f3n incompleta (token o studentId faltante)');
      }

      if (!studentName) studentName = String(studentId);

      authClient.setAuth(token, String(studentId), studentName);

      if (mounted.current) onLoginSuccess(token, String(studentId), studentName);
    } catch (err) {
      console.error('[LoginView] login error:', err);
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      // Always clear loading state to avoid permanent spinner
      try {
        if (mounted.current) setLoading(false);
      } catch (e) {
        // ignore
      }
    }
  }

  async function doSignUp(
    emailVal: string,
    passwordVal: string,
    nameVal: string
  ) {
    setLoading(true);
    setError(null);

    try {
      await authClient.signup(
        emailVal,
        passwordVal,
        nameVal
      );

      await doLogin(emailVal, passwordVal);
    } catch (err) {
      if (!mounted.current) return;

      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }

  const onSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSignUp) {
      doSignUp(email, password, name);
    } else {
      doLogin(email, password);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form
        className={styles.loginBox}
        onSubmit={onSubmit}
        aria-label="Login form"
      >
        <h1>🎵 Music Learning</h1>

        <div className={styles.controls}>
          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="correo@ejemplo.com"
            required
          />

          {isSignUp && (
            <>
              <label htmlFor="login-name">
                Nombre
              </label>

              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Tu nombre"
                required
              />
            </>
          )}

          <label htmlFor="login-password">
            Contraseña
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="********"
            required
          />
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? isSignUp
                ? 'Creando...'
                : 'Ingresando...'
              : isSignUp
              ? 'Crear cuenta'
              : 'Ingresar'}
          </button>

          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Ingresar'
              : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </div>
  );
};