import React, { useEffect, useId, useRef } from 'react';
import styles from './DisclaimerDialog.module.css';

interface DisclaimerDialogProps {
  onClose: () => void;
}

export const DisclaimerDialog: React.FC<DisclaimerDialogProps> = ({ onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      lang="es"
      onCancel={(event) => event.preventDefault()}
    >
      <h2 id={titleId}>Aviso sobre el uso de datos</h2>
      <div id={descriptionId}>
        <p>
          Los datos recopilados durante las sesiones de los usuarios son
          anonimizados y serán utilizados en un estudio científico-tecnológico.
        </p>
        <p>
          Si eres menor de edad, debes contar con la autorización de tus padres
          o tutores para utilizar esta aplicación.
        </p>
      </div>
      <button type="button" className={styles.button} onClick={onClose}>
        Entendido
      </button>
    </dialog>
  );
};
