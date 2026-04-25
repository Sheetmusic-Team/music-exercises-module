import React from 'react';
import { MusicModule } from './MusicModule';

const App: React.FC = () => (
  <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
    <MusicModule userId="test-user" onEvent={e => console.log(e)} config={{ mode: 'practice', allowHints: true }} />
  </div>
);

export default App;
