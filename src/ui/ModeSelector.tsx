import React, { useEffect } from 'react';
import styles from './ModeSelector.module.css';

interface ModeSelectorProps {
  onSelectMode: (mode: 'global' | 'subject') => void;
  onLogout?: () => void;
  studentName: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSelectMode,
  onLogout,
  studentName
}) => {

  useEffect(() => {
    console.log('MODE SELECTOR RENDER');
    console.log('STUDENT NAME:', studentName);
  }, [studentName]);

  if (!studentName) {

    console.error('NO STUDENT NAME');

    return (
      <div className={styles.container}>
        <h2>No hay nombre de estudiante</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <h1>
          🎵 Bienvenido, {studentName}!
        </h1>

        <p>
          ¿Qué tipo de entrenamiento deseas hacer?
        </p>
      </div>

      <div className={styles.modeGrid}>

        <button
          className={`
            ${styles.modeCard}
            ${styles.globalMode}
          `}
          onClick={() => {
            console.log('GLOBAL MODE CLICK');
            onSelectMode('global');
          }}
        >

          <div className={styles.icon}>
            🌍
          </div>

          <h2>
            Entrenamiento Global
          </h2>

          <p>
            Ejercicios de todos los temas
          </p>

          <span className={styles.description}>
            El sistema elegirá los ejercicios
            según tu progreso
          </span>

        </button>

        <button
          className={`
            ${styles.modeCard}
            ${styles.subjectMode}
          `}
          onClick={() => {
            console.log('SUBJECT MODE CLICK');
            onSelectMode('subject');
          }}
        >

          <div className={styles.icon}>
            📚
          </div>

          <h2>
            Por Asignatura
          </h2>

          <p>
            Enfócate en un tema específico
          </p>

          <span className={styles.description}>
            Elige el nodo en el que quieres entrenar
          </span>

        </button>

        {/* Logout card placed after 'Por Asignatura' as requested */}
        <button
          className={`
            ${styles.modeCard}
            ${styles.subjectMode}
          `}
          onClick={() => {
            console.log('LOGOUT CLICK');
            if (onLogout) onLogout();
          }}
        >

          <div className={styles.icon}>
          😓
          </div>

          <h2>
            Salir
          </h2>

          <p>
            Cerrar sesión
          </p>

          <span className={styles.description}>
            Volver al inicio
          </span>

        </button>

      </div>

    </div>
  );
};