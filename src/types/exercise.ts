// Tipos base para ejercicios musicales
export type Exercise = {
  id: string;
  type: 'rhythm' | 'melody' | string;
  prompt: string;
  data: any; // Puede ser extendido para cada tipo de ejercicio
  difficulty: number;
  hint?: string; // Pista opcional
  hintUnlockTime?: number; // Tiempo en segundos para desbloquear pista (default: 10)
};

export type Feedback = {
  score: number;
  message?: string;
  details?: any;
};
