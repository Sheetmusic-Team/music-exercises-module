import React, { useState } from 'react';
import styles from './ModeSelector.module.css';

interface CommentBoxProps {
  backendUrl: string;
  studentId?: string;
  authToken?: string | null;
  onClose: () => void;
}

const CommentBox: React.FC<CommentBoxProps> = ({ backendUrl, studentId, authToken, onClose }) => {
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    setSent(false);
    try {
      const url = backendUrl ? `${backendUrl.replace(/\/$/, '')}/api/comments` : '/api/comments';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      // Enviar el comentario usando studentId si está presente
      const body: Record<string, any> = { content: comment };
      if (studentId) body.studentId = studentId;
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        setSent(true);
        setComment('');
      }
    } catch {
      // opcional: manejo de error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.commentModalOverlay}>
      <div className={styles.commentModalBox}>
        <button className={styles.commentModalClose} onClick={onClose} aria-label="Cerrar">×</button>
        <h3 style={{ marginTop: 0 }}>Deja tu comentario</h3>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Escribe tu comentario aquí..."
          rows={4}
          className={styles.commentModalTextarea}
        />
        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleSend}
            disabled={sending || !comment.trim()}
            className={styles.commentModalSendBtn}
            style={{ marginRight: 8 }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
          {sent && <span style={{ marginLeft: 12, color: 'green' }}>¡Comentario enviado!</span>}
        </div>
      </div>
    </div>
  );
};

export default CommentBox;