// Cliente DRL: conexión con backend + DRL Engine

import type {
  Exercise,
  Feedback
} from '../../../types/exercise';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

interface SessionEventRequest {
  node: string;
  correct: boolean;
  difficulty: number;
  response_time: number;
}

interface StudentStats {
  proficiencies: Record<string, number>;
  totalSessions: number;
  averageReward: number;
  averageSuccessRate: number;
}

interface SessionResult {
  sessionId: string;
  rewards: Record<string, number>;
  proficiencies: Record<string, number>;
}

export interface DRLClient {

  getExercise(
    userId: string,
    token: string,
    focusNode?: string
  ): Promise<Exercise>;

  submitSessionEvent(
    userId: string,
    token: string,
    event: SessionEventRequest
  ): Promise<Feedback>;

  endSession(
    userId: string,
    token: string,
    events: SessionEventRequest[]
  ): Promise<SessionResult>;

  getStudentStats(
    userId: string,
    token: string
  ): Promise<StudentStats>;

}

export const drlClient: DRLClient = {

  // ========================================
  // OBTENER EJERCICIO
  // ========================================

  async getExercise(
    _,
    token,
    focusNode
  ) {

    console.log('======================');
    console.log('GET EXERCISE');
    console.log('======================');

    console.log(
      'BACKEND URL:',
      BACKEND_URL
    );

    console.log(
      'TOKEN:',
      token
    );

    console.log(
      'FOCUS NODE:',
      focusNode
    );

    const options: RequestInit = {

      method:
        focusNode
          ? 'POST'
          : 'GET',

      headers: {
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`,
      },

    };

    // MODO FOCUS
    if (focusNode) {

      console.log(
        'USANDO MODO FOCUS'
      );

      options.body = JSON.stringify({

        focus: {
          nodes: [focusNode],
          strict: true,
        },

      });

    }

    // MODO GLOBAL
    else {

      console.log(
        'USANDO MODO GLOBAL'
      );

    }

    console.log(
      'REQUEST OPTIONS:',
      options
    );

    try {

      const response = await fetch(
        `${BACKEND_URL}/api/exercises/next`,
        options
      );

      console.log(
        'RESPONSE STATUS:',
        response.status
      );

      console.log(
        'RESPONSE OK:',
        response.ok
      );

      const rawText =
        await response.text();

      console.log(
        'RAW RESPONSE:',
        rawText
      );

      // Intentar parsear JSON
      let data;

      try {

        data =
          JSON.parse(rawText);

      } catch (jsonError) {

        console.error(
          'JSON PARSE ERROR:',
          jsonError
        );

        throw new Error(
          'Respuesta inválida del backend'
        );

      }

      console.log(
        'PARSED RESPONSE:',
        data
      );

      // ERROR BACKEND
      if (!response.ok) {

        console.error(
          'BACKEND ERROR:',
          data
        );

        throw new Error(
          data.error ||
          `HTTP ${response.status}`
        );

      }

      // VALIDAR RESPONSE
      if (!data?.data?.exercise) {

        console.error(
          'NO EXERCISE FOUND:',
          data
        );

        throw new Error(
          'No exercise returned'
        );

      }

      console.log(
        'EXERCISE:',
        data.data.exercise
      );

      return data.data.exercise;

    } catch (error) {

      console.error(
        'GET EXERCISE ERROR:',
        error
      );

      throw error;

    }

  },

  // ========================================
  // ENVIAR EVENTO
  // ========================================

  async submitSessionEvent(
    _,
    token,
    event
  ) {

    console.log(
      'SUBMIT SESSION EVENT:',
      event
    );

    const response = await fetch(
      `${BACKEND_URL}/api/sessions/end`,
      {

        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({

          events: [event],

          sessionMetadata: {
            completedAt:
              new Date().toISOString(),
          },

        }),

      }
    );

    console.log(
      'SUBMIT RESPONSE STATUS:',
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        'SUBMIT ERROR:',
        errorText
      );

      throw new Error(
        `Error submitting event: ${response.statusText}`
      );

    }

    const result =
      await response.json();

    console.log(
      'SUBMIT RESULT:',
      result
    );

    return {

      score: Math.round(
        (result.rewards?.total || 0)
        * 100
      ),

      message:
        event.correct
          ? '✅ ¡Correcto!'
          : '❌ Intenta de nuevo',

      details: {
        reward:
          result.rewards?.total || 0,

        proficiencies:
          result.proficiencies,
      },

    };

  },

  // ========================================
  // FINALIZAR SESIÓN
  // ========================================

  async endSession(
    _,
    token,
    events
  ) {

    console.log(
      'END SESSION EVENTS:',
      events
    );

    const response = await fetch(
      `${BACKEND_URL}/api/sessions/end`,
      {

        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({

          events,

          sessionMetadata: {
            completedAt:
              new Date().toISOString(),
          },

        }),

      }
    );

    console.log(
      'END SESSION STATUS:',
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        'END SESSION ERROR:',
        errorText
      );

      throw new Error(
        `Error ending session: ${response.statusText}`
      );

    }

    const data =
      await response.json();

    console.log(
      'END SESSION RESPONSE:',
      data
    );

    return data;

  },

  // ========================================
  // STATS
  // ========================================

  async getStudentStats(
    userId,
    token
  ) {

    console.log(
      'GET STUDENT STATS:',
      userId
    );

    const response = await fetch(

      `${BACKEND_URL}/api/students/${userId}/stats`,

      {

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

      }

    );

    console.log(
      'STATS STATUS:',
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        'STATS ERROR:',
        errorText
      );

      throw new Error(
        `Error fetching stats: ${response.statusText}`
      );

    }

    const data =
      await response.json();

    console.log(
      'STATS RESPONSE:',
      data
    );

    return data;

  },

};