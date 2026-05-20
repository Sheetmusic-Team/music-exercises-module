// File: NodeSelector.tsx - Author: Vicente Alves
import React from 'react';
import styles from './NodeSelector.module.css';
import nodesJson from '../../data/nodes.json';

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

  // Load nodes from bundled JSON. This avoids a runtime HTTP request and
  // ensures the component works in production (and during static deploys).
  const nodes: Node[] = (() => {
    try {
      const maybeNodes = (nodesJson as unknown) as { nodes?: unknown };
      const raw = maybeNodes?.nodes ?? [];
      return Array.isArray(raw) ? (raw as Node[]) : [];
    } catch (e) {
      console.error('Could not load nodes.json from bundle:', e);
      return [];
    }
  })();

  // If there are no nodes available, show a simple message and back button
  if (!nodes || nodes.length === 0) {
    console.warn('No nodes available to display')
    return (
      <div className={styles.container}>
        <p className={styles.error}>No se encontraron nodos</p>
        <button onClick={onBack}>← Volver</button>
      </div>
    )
  }

  const nodesByLevel: Record<number, Node[]> = {};

  nodes.forEach((node) => {

  // Optionally log nodes during development
  // console.log('NODE:', node);

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