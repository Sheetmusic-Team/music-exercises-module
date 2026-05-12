// Tipos base para ejercicios musicales
export type Exercise = {
  id: string;
  type: string;
  prompt: string;
  data: Record<string, unknown>;
  difficulty: number;
  node?: string; // ID del nodo (1a, 2a, 3a, etc.)
  hint?: string;
  hintUnlockTime?: number;
};

export type Feedback = {
  score: number;
  message?: string;
  details?: Record<string, unknown>;
};
