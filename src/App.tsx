import React from 'react';
import { MusicModule } from './MusicModule';

const App: React.FC = () => (
  <MusicModule
    config={{ mode: 'practice', allowHints: true }}
    onEvent={(event) => console.log('Event:', event)}
  />
);

export default App;
