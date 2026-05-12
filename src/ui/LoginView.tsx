// ui/LoginView.tsx

import React, { useState } from 'react';
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
  onLoginSuccess
}) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);
    setError('');

    try {

      console.log('ANTES LOGIN');

      const response =
        await authClient.login(email, password);

      console.log(
        'LOGIN RESPONSE COMPLETA:',
        response
      );

      // ====================================
      // VALIDACIONES
      // ====================================

      if (!response.accessToken) {
        throw new Error(
          'No accessToken recibido'
        );
      }

      // Si backend devuelve student anidado
      const studentId =
        response.studentId ||
        response.student?.id;

      const studentName =
        response.name ||
        response.student?.name;

      console.log('STUDENT ID:', studentId);
      console.log('STUDENT NAME:', studentName);

      if (!studentId) {
        throw new Error(
          'No studentId recibido'
        );
      }

      if (!studentName) {
        throw new Error(
          'No studentName recibido'
        );
      }

      // ====================================
      // SAVE AUTH
      // ====================================

      authClient.setAuth(
        response.accessToken,
        studentId,
        studentName
      );

      console.log('AUTH SAVED');

      // ====================================
      // CALLBACK
      // ====================================

      onLoginSuccess(
        response.accessToken,
        studentId,
        studentName
      );

      console.log(
        'LOGIN SUCCESS CALLBACK'
      );

    } catch (err) {

      console.error(
        'LOGIN ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión'
      );

    } finally {

      setLoading(false);

    }
  };

  const handleSignUp = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);
    setError('');

    try {

      console.log('CREANDO CUENTA');

      await authClient.signup(
        email,
        password,
        name
      );

      console.log('CUENTA CREADA');

      const loginResponse =
        await authClient.login(
          email,
          password
        );

      console.log(
        'LOGIN RESPONSE:',
        loginResponse
      );

      const studentId =
        loginResponse.studentId ||
        loginResponse.student?.id;

      const studentName =
        loginResponse.name ||
        loginResponse.student?.name;

      if (!studentId || !studentName) {
        throw new Error(
          'Datos incompletos del usuario'
        );
      }

      authClient.setAuth(
        loginResponse.accessToken,
        studentId,
        studentName
      );

      onLoginSuccess(
        loginResponse.accessToken,
        studentId,
        studentName
      );

    } catch (err) {

      console.error(
        'SIGNUP ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Error al crear cuenta'
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className={styles.loginContainer}>

      <div className={styles.loginBox}>

        <h1>
          🎵 Bienvenido a Music Learning
        </h1>

        <div className={styles.tabs}>

          <button
            className={`
              ${styles.tab}
              ${isSignUp
                ? ''
                : styles.active}
            `}
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setName('');
            }}
          >
            Ingresar
          </button>

          <button
            className={`
              ${styles.tab}
              ${isSignUp
                ? styles.active
                : ''}
            `}
            onClick={() => {
              setIsSignUp(true);
              setError('');
            }}
          >
            Crear Cuenta
          </button>

        </div>

        <form
          onSubmit={
            isSignUp
              ? handleSignUp
              : handleLogin
          }
        >

          {isSignUp && (

            <div className={styles.formGroup}>

              <label htmlFor="name">
                Nombre:
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Tu nombre"
                required
              />

            </div>

          )}

          <div className={styles.formGroup}>

            <label htmlFor="email">
              Email:
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="tu@email.com"
              required
            />

          </div>

          <div className={styles.formGroup}>

            <label htmlFor="password">
              Contraseña:
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="tu contraseña"
              autoComplete="current-password"
              required
            />

          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >

            {loading
              ? (
                isSignUp
                  ? 'Creando...'
                  : 'Ingresando...'
              )
              : (
                isSignUp
                  ? 'Crear Cuenta'
                  : 'Ingresar'
              )}

          </button>

        </form>

      </div>

    </div>
  );
};