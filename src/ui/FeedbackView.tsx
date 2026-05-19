// Vista de feedback al usuario

import React, { useEffect } from 'react';
import type { Feedback } from '../types/exercise';
import styles from './FeedbackView.module.css';

interface FeedbackViewProps {
  feedback: Feedback | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  feedback,
  isOpen = true,
  onClose
}) => {

  // ========================================
  // DEBUG
  // ========================================

  useEffect(() => {
    console.log('========== FEEDBACK VIEW ==========');
    console.log('FEEDBACK:', feedback);
    console.log('===================================');
  }, [feedback]);

  // If the parent closed the view, hide it (do this after hooks)
  if (!isOpen) return null;

  // ========================================
  // PROTECCIÓN
  // ========================================

  if (!feedback) {
    console.error('FEEDBACK ES NULL');
    return (
      <div className={styles.container}>
        <h2>No hay feedback</h2>
      </div>
    );
  }

  // ========================================
  // DATOS SEGUROS
  // ========================================

  const score =
    typeof feedback.score === 'number'
      ? feedback.score
      : 0;

  const message =
    feedback.message || '';

  const details =
    feedback.details || null;

  // ========================================
  // RENDER
  // ========================================

  // Prepare emoji without nested ternary for readability
  let emoji = '💪';
  if (score >= 50) emoji = '👍';
  if (score >= 80) emoji = '🎉';

  return (
    <section className={styles.container} aria-label="Feedback"> 

      <div className={styles.header}>

        <div className={styles.headerLeft}>
          <h3 className={styles.title}>
            {emoji} Feedback
          </h3>
          <p className={styles.subtitle}>Resultado del ejercicio</p>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Volver atrás"
            onClick={() => {
              if (onClose) onClose();
            }}
          >
            ← Volver
          </button>
        </div>

      </div>

      {/* ======================================== */}
      {/* SCORE */}
      {/* ======================================== */}

      <div className={styles.scoreBox}>

        <div className={styles.scoreCircle}>

          <span className={styles.scoreValue}>
            {score}
          </span>

          <span className={styles.scoreLabel}>
            / 100
          </span>

        </div>

        <div className={styles.scoreBar}>

          <div
            className={styles.scoreFill}
            style={{
              width: `${score}%`
            }}
          />

        </div>

      </div>

      {/* ======================================== */}
      {/* MESSAGE */}
      {/* ======================================== */}

      {message && (
        <div className={styles.message}>
          <p>{message}</p>
        </div>
      )}

      {/* ======================================== */}
      {/* DETAILS */}
      {/* ======================================== */}


      {details && (
        <div className={styles.details}>
          {details.correctNotes !== undefined && (
            <div className={styles.detailItem}>
              <span className={styles.label}>Notas correctas:</span>
              <span className={styles.value}>{details.correctNotes}/{details.totalNotes}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.feedbackFooter}>
        <div className={styles.footerLeft}>
          <small className={styles.hint}>¿Quieres repetir este ejercicio? Pulsa Siguiente para continuar la práctica.</small>
        </div>
        <div className={styles.footerRight}>
          {/* The parent (MusicModule) renders the next / end buttons; keep footer minimal for context */}
        </div>
      </div>

    </section>
  );
};