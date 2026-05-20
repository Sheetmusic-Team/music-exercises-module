// File: src/ui/LoginView.tsx

import React, { useEffect, useRef, useState } from 'react'
import { authClient } from '../services/auth/authClient'
import styles from './LoginView.module.css'

interface LoginViewProps {
  onLoginSuccess: (
    token: string,
    studentId: string,
    name: string
  ) => void
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mounted = useRef(true)

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  async function doLogin(
    emailVal: string,
    passwordVal: string
  ) {
    setLoading(true)
    setError(null)

    try {
      const response = await authClient.login(
        emailVal,
        passwordVal
      )

      console.info(
        '[LoginView] login response (raw):',
        response
      )

      const token =
        (response as any)?.accessToken ??
        (response as any)?.access_token ??
        (response as any)?.token ??
        null

      const studentId =
        (response as any)?.studentId ??
        (response as any)?.student?.id ??
        (response as any)?.user?.id ??
        null

      let studentName =
        (response as any)?.name ??
        (response as any)?.student?.name ??
        (response as any)?.user?.email ??
        ''

      console.info(
        '[LoginView] normalized auth:',
        {
          token,
          studentId,
          studentName
        }
      )

      if (!token || !studentId) {
        throw new Error(
          'Respuesta de autenticación incompleta'
        )
      }

      if (!studentName) {
        studentName = emailVal.split('@')[0]
      }

      console.log('LLAMANDO onLoginSuccess')

      onLoginSuccess(
        String(token),
        String(studentId),
        studentName
      )

    } catch (err) {
      console.error(
        '[LoginView] login error:',
        err
      )

      if (mounted.current) {
        setError(
          err instanceof Error
            ? err.message
            : String(err)
        )
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }

  async function doSignUp(
    emailVal: string,
    passwordVal: string,
    nameVal: string
  ) {
    setLoading(true)
    setError(null)

    try {
      await authClient.signup(
        emailVal,
        passwordVal,
        nameVal
      )

      await doLogin(emailVal, passwordVal)
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error
            ? err.message
            : String(err)
        )

        setLoading(false)
      }
    }
  }

  const onSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (isSignUp) {
      doSignUp(email, password, name)
    } else {
      doLogin(email, password)
    }
  }

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
            autoComplete="email"
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
                autoComplete="name"
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
            autoComplete="current-password"
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
              ? (
                  isSignUp
                    ? 'Creando...'
                    : 'Ingresando...'
                )
              : (
                  isSignUp
                    ? 'Crear cuenta'
                    : 'Ingresar'
                )}
          </button>

          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Ingresar'
              : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LoginView
