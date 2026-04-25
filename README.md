# music-exercises-module

Componente React embebible que provee ejercicios de lectura musical (renderizado con VexFlow) y un pequeño flujo de interacción con un servicio externo (DRL). Está pensado para integrarse como frontend embebido dentro de una aplicación Ionic React o cualquier aplicación React.

Características principales
- Componente principal: `MusicModule` (props: `userId`, `sessionId?`, `config?`, `onEvent`).
- Vista de ejercicio con renderizado de pentagrama mediante VexFlow (`ExerciseView`).
- Vista de feedback (`FeedbackView`).
- Orquestador de flujo `FlowController` que usa `services/drl/drlClient` para obtener ejercicios y enviar respuestas.
- Desarrollado con Vite + React + TypeScript para HMR y builds rápidos.

Estado
- Implementación del frontend lista para desarrollo y test.
- El backend (DRL) debe proveer endpoints compatibles con `src/services/drl/drlClient` (getExercise, sendAnswer, getFeedback). Ver `src/core/flowController.ts` para el flujo esperado.

Requisitos
- Node 18+ recomendado
- npm o yarn

Instalación y desarrollo
1. Instala dependencias:

```bash
npm install
```

2. Ejecuta en modo desarrollo (Vite):

```bash
npm run dev
```

3. Build de producción:

```bash
npm run build
npm run preview
```

Scripts útiles
- `dev` - servidor de desarrollo (HMR)
- `build` - transpila TypeScript y genera build de Vite
- `lint` - ejecuta eslint
- `preview` - sirve la build para pruebas locales

Integración en Ionic React
La forma más directa de integrar este módulo en una app Ionic React es importar el componente `MusicModule` dentro de una página React. Dos caminos comunes:

1) Copiar/pegar el código fuente dentro del monorepo Ionic (rápido para desarrollo).

2) Publicar o consumir como paquete local / dependecia por ruta. Por ejemplo, en el `package.json` de tu app Ionic:

```json
"dependencies": {
  "music-exercises-module": "file:../ruta/al/music-exercises-module"
}
```

Ejemplo de uso en una página Ionic React

```tsx
import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { MusicModule } from 'music-exercises-module/src/MusicModule'; // o desde el paquete si lo instalas

const ExercisesPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ejercicios musicales</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <MusicModule
          userId="user-123"
          sessionId="session-abc"
          config={{ mode: 'practice', allowHints: true }}
          onEvent={(e) => console.log('evento módulo:', e)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ExercisesPage;
```

Notas para Ionic
- Ionic React es compatible con componentes React normales; dentro de `IonContent` puedes renderizar el `MusicModule` sin problemas.
- Si usas routing lazy-loading en Ionic, importa el módulo en la página correspondiente.
- Asegúrate de incluir estilos (los módulos CSS locales están en `src/*.module.css`). Si empaquetas como paquete, verifica que el bundler incluya CSS.

API esperada del backend (dr lClient)
- El flujo del frontend asume que `src/services/drl/drlClient` expone al menos:
  - `getExercise(userId, sessionId)` → devuelve un objeto `Exercise` con campos como `id`, `type`, `prompt`, `data` (notas, clef, timeSignature), `difficulty`, `hint`, `hintUnlockTime`.
  - `sendAnswer(userId, sessionId, answer)` → registra la respuesta del alumno.
  - `getFeedback(userId, sessionId)` → devuelve un objeto `Feedback` con `score`, `message`, `details`.

Si tu backend usa diferentes rutas, adapta `src/services/drl/drlClient` para cumplir con estas llamadas. Actualmente `FlowController` usa estas llamadas asíncronas y emite eventos (`exercise_loaded`, `answer_submitted`, `feedback_received`, `session_completed`) a través del callback `onEvent`.

Empaquetado y distribución
- Para integrar en otra app sin copiar código, puedes:
  - Publicar en un registry privado (npm) y luego instalarlo.
  - Usar `file:` en `package.json` para consumir localmente.
  - Publicar en GitHub y consumir vía `"music-exercises-module": "github:usuario/repo"`.

Consejos de desarrollo
- Si deseas exponer el módulo como un bundle UMD o Web Component (para consumo en apps no-React), añade una configuración de build para librería en `vite.config.ts`.
- Mantén `drlClient` configurable para apuntar a entornos `dev` y `prod` (variables de entorno).

Estructura relevante
- `src/MusicModule.tsx` — componente embebible principal.
- `src/core/flowController.ts` — orquestador de ejercicios y comunicación con el servicio DRL.
- `src/services/drl` — cliente que comunica con el backend.
- `src/ui` — vistas `ExerciseView` y `FeedbackView`.

Contacto y contribución
- Pull requests y issues bienvenidos. Abre issues para inconsistencias en la API esperada o mejoras en la integración con Ionic.

Licencia
- MIT (o la que prefieras poner).

