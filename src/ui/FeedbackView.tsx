// Vista de feedback al usuario
import React from 'react';
import type { Feedback } from '../types/exercise';
import styles from './FeedbackView.module.css';

interface FeedbackViewProps {
  feedback: Feedback;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ feedback }) => (
  <div className={styles.container}>
    <div className={styles.header}>
      <h3 className={styles.title}>
        {feedback.score >= 80 ? '🎉' : feedback.score >= 50 ? '👍' : '💪'}
        Feedback
      </h3>
    </div>
    
    <div className={styles.scoreBox}>
      <div className={styles.scoreCircle}>
        <span className={styles.scoreValue}>{feedback.score}</span>
        <span className={styles.scoreLabel}>/ 100</span>
      </div>
      <div className={styles.scoreBar}>
        <div 
          className={styles.scoreFill}
          style={{ width: `${feedback.score}%` }}
        />
      </div>
    </div>

    {feedback.message && (
      <div className={styles.message}>
        <p>{feedback.message}</p>
      </div>
    )}

    {feedback.details && (
      <div className={styles.details}>
        {feedback.details.correctNotes !== undefined && (
          <div className={styles.detailItem}>
            <span className={styles.label}>Notas correctas:</span>
            <span className={styles.value}>
              {feedback.details.correctNotes}/{feedback.details.totalNotes}
            </span>
          </div>
        )}
      </div>
    )}
  </div>
);
