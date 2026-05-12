// Vista de feedback al usuario

import React, { useEffect } from 'react';
import type { Feedback } from '../types/exercise';
import styles from './FeedbackView.module.css';

interface FeedbackViewProps {
  feedback: Feedback | null;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  feedback
}) => {

  // ========================================
  // DEBUG
  // ========================================

  useEffect(() => {
    console.log('========== FEEDBACK VIEW ==========');
    console.log('FEEDBACK:', feedback);
    console.log('===================================');
  }, [feedback]);

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

  return (
    <div className={styles.container}>

      <div className={styles.header}>

        <h3 className={styles.title}>

          {score >= 80
            ? '🎉'
            : score >= 50
              ? '👍'
              : '💪'}

          {' '}Feedback

        </h3>

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

              <span className={styles.label}>
                Notas correctas:
              </span>

              <span className={styles.value}>

                {details.correctNotes}/
                {details.totalNotes}

              </span>

            </div>

          )}

        </div>

      )}

    </div>
  );
};