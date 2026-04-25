// Cliente DRL: conexión con backend adaptativo
import type { Exercise, Feedback } from '../../../types/exercise';

export interface DRLClient {
  getExercise(userId: string, sessionId: string): Promise<Exercise>;
  sendAnswer(userId: string, sessionId: string, answer: any): Promise<void>;
  getFeedback(userId: string, sessionId: string): Promise<Feedback>;
}

// Implementación mock para desarrollo
// Ejemplo de ejercicio de partitura (ritmo o melodía)
// El campo data contiene la notación en formato MusicXML, ABC, o un JSON propio para VexFlow
export const drlClient: DRLClient = {
  async getExercise(userId, sessionId) {
    // Ejemplo: ejercicio de ritmo con partitura en notación VexFlow JSON
    return {
      id: 'ex1',
      type: 'rhythm',
      prompt: 'Lee y marca el ritmo de la siguiente partitura:',
      hint: 'Observa que hay dos corcheas (mitad de negra) entre las negras. Cuenta: 1 - 1 medio - 1 medio - 1 - 1',
      hintUnlockTime: 5, // Desbloquear pista después de 10 segundos
      data: {
        // Notación VexFlow simple (puedes adaptar a tu parser de VexFlow)
        notes: [
          { keys: ['c/4'], duration: 'q' }, // 1
          { keys: ['d/4'], duration: '8' }, // 0.5
          { keys: ['e/4'], duration: '8' }, // 0.5
          { keys: ['f/4'], duration: 'q' }, // 1
          { keys: ['g/4'], duration: 'q' }, // 1
        ],
        timeSignature: '4/4',
        clef: 'treble',
      },
      difficulty: 1,
    };
  },
  async sendAnswer(userId, sessionId, answer) {
    // Enviar respuesta al backend (mock)
    // answer: { timestamps: [...], userNotes: [...] }
    return;
  },
  async getFeedback(userId, sessionId) {
    // Feedback simulado
    return {
      score: Math.floor(Math.random() * 100),
      message: '¡Buen trabajo! Sigue practicando.',
      details: {
        correctNotes: 3,
        totalNotes: 4,
      },
    };
  },
};

// Ejemplo de objeto Exercise (JSON) para partitura:
/*
{
  "id": "ex1",
  "type": "rhythm",
  "prompt": "Lee y marca el ritmo de la siguiente partitura:",
  "data": {
    "notes": [
      { "keys": ["c/4"], "duration": "q" },
      { "keys": ["d/4"], "duration": "8" },
      { "keys": ["e/4"], "duration": "8" },
      { "keys": ["f/4"], "duration": "q" }
    ],
    "timeSignature": "4/4",
    "clef": "treble"
  },
  "difficulty": 1
}
*/
