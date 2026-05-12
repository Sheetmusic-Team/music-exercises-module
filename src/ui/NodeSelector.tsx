import React, { useState, useEffect } from 'react';
import styles from './NodeSelector.module.css';

interface Node {
  id: string;
  name: string;
  description: string;
  level: number;
  type: string;
  generator?: string;
  prerequisites?: string[];
  locked?: boolean;
}

interface NodeSelectorProps {
  onSelectNode: (nodeId: string) => void;
  onBack: () => void;
}

export const NodeSelector: React.FC<NodeSelectorProps> = ({
  onSelectNode,
  onBack
}) => {

  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    console.log('NODE SELECTOR MOUNT');

    fetch('/data/nodes.json')

      .then((res) => {

        console.log('NODES RESPONSE:', res);

        return res.json();
      })

      .then((data) => {

        console.log('NODES DATA:', data);

        if (!data?.nodes) {

          console.error('NO NODES FOUND');

          setError('No se encontraron nodos');

          setLoading(false);

          return;
        }

        setNodes(data.nodes);

        console.log(
          'NODES LOADED:',
          data.nodes.length
        );

        setLoading(false);
      })

      .catch((err) => {

        console.error(
          'ERROR LOADING NODES:',
          err
        );

        setError(
          'Error al cargar los nodos'
        );

        setLoading(false);
      });

  }, []);

  if (loading) {

    console.log('NODES LOADING...');

    return (
      <div className={styles.container}>
        <p>Cargando nodos...</p>
      </div>
    );
  }

  if (error) {

    console.error('NODE ERROR:', error);

    return (
      <div className={styles.container}>

        <p className={styles.error}>
          {error}
        </p>

        <button onClick={onBack}>
          ← Volver
        </button>

      </div>
    );
  }

  const nodesByLevel: Record<number, Node[]> = {};

  nodes.forEach((node) => {

    console.log('NODE:', node);

    if (!nodesByLevel[node.level]) {
      nodesByLevel[node.level] = [];
    }

    nodesByLevel[node.level].push(node);
  });

  const levels = Object.keys(nodesByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  console.log('LEVELS:', levels);

  return (
    <div className={styles.container}>

      <div className={styles.header}>

        <button
          className={styles.backBtn}
          onClick={() => {

            console.log('BACK CLICK');

            onBack();
          }}
        >
          ← Volver
        </button>

        <h1>
          📚 Selecciona una Asignatura
        </h1>

      </div>

      {levels.map((level) => (

        <div
          key={level}
          className={styles.levelSection}
        >

          <h2 className={styles.levelTitle}>
            Nivel {level}
          </h2>

          <div className={styles.nodeGrid}>

            {nodesByLevel[level].map((node) => (

              <button
              key={node.id}
                className={`
                  ${styles.nodeCard}
                  ${node.locked ? styles.locked : ''}
                `}
                onClick={() => {
                  if (!node.locked) {
                    onSelectNode(node.id);
                  }
                }}
                disabled={node.locked}
              >
                <div className={styles.nodeId}>
                  {node.locked ? '🔒' : '🎵'} {node.id}
                </div>

                <h3>{node.name}</h3>

                <p>{node.description}</p>

                {node.locked && (
                  <span className={styles.lockedText}>
                    Próximamente
                  </span>
                )}
              </button>

            ))}

          </div>

        </div>

      ))}

    </div>
  );
};