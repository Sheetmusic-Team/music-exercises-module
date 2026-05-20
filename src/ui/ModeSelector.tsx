// File: ModeSelector.tsx - Author: Vicente Alves (Corregido)
import React, { useEffect, useState } from 'react';
import CommentBox from './CommentBox';
import styles from './ModeSelector.module.css';

interface ModeSelectorProps {
  onSelectMode: (mode: 'global' | 'subject') => void;
  onLogout?: () => void;
  studentName: string;
  authToken?: string | null;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSelectMode,
  onLogout,
  studentName,
  authToken
}) => {
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || '';

  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    console.log('MODE SELECTOR RENDER');
    console.log('STUDENT NAME:', studentName);
  }, [studentName]);

  // Si no hay nombre aún, evitamos romper el flujo visual con una pantalla dura de error
  const displayName = studentName || 'Estudiante';

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>
            🎵 ¡Bienvenido, {displayName}!
          </h1>
          <p>
            ¿Qué tipo de entrenamiento deseas hacer?
          </p>
        </div>
        <div className={styles.modeGrid}>
          <button
            className={`${styles.modeCard} ${styles.globalMode}`}
            onClick={() => {
              console.log('GLOBAL MODE CLICK');
              onSelectMode('global');
            }}
          >
            <div className={styles.icon}>🌍</div>
            <h2>Entrenamiento Global</h2>
            <p>Ejercicios de todos los temas</p>
            <span className={styles.description}>
              El sistema elegirá los ejercicios según tu progreso
            </span>
          </button>

          <button
            className={`${styles.modeCard} ${styles.subjectMode}`}
            onClick={() => {
              console.log('SUBJECT MODE CLICK');
              onSelectMode('subject');
            }}
          >
            <div className={styles.icon}>📚</div>
            <h2>Por Asignatura</h2>
            <p>Enfócate en un tema específico</p>
            <span className={styles.description}>
              Elige el nodo en el que quieres entrenar
            </span>
          </button>

          {/* Botón comentar */}
          <button
            className={`${styles.modeCard} ${styles.subjectMode}`}
            onClick={() => setShowComment(v => !v)}
          >
            <div className={styles.icon}>💬</div>
            <h2>Comentar</h2>
            <p>Deja un comentario o sugerencia</p>
            <span className={styles.description}>Tus comentarios nos ayudan a mejorar</span>
          </button>

          <button
            className={`${styles.modeCard} ${styles.subjectMode}`}
            onClick={async () => {
              console.log('LOGOUT CLICK');
              try {
                const url = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/api/auth/logout` : '/api/auth/logout';
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
                const resp = await fetch(url, { method: 'POST', headers });
                let body: unknown = null;
                try {
                  const ct = resp.headers.get('content-type') || '';
                  if (ct.includes('application/json')) body = await resp.json();
                } catch {
                  // ignore
                }
                console.log('LOGOUT RESPONSE:', resp.status, body);
              } catch (err) {
                console.warn('Logout request failed', err);
              } finally {
                if (onLogout) onLogout();
              }
            }}
          >
            <div className={styles.icon}>😓</div>
            <h2>Salir</h2>
            <p>Cerrar sesión</p>
            <span className={styles.description}>Volver al inicio</span>
          </button>
        </div>
      </div>
      {/* El modal va fuera del grid para no mover los botones */}
      {showComment && (
        <CommentBox
          backendUrl={BACKEND_URL}
          studentName={studentName}
          authToken={authToken}
          onClose={() => setShowComment(false)}
        />
      )}
    </>
  );
};