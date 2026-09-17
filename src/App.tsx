import React, { useState } from 'react';
import { MusicModule } from './MusicModule';
import { DisclaimerDialog } from './ui/DisclaimerDialog';

const App: React.FC = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  return (
    <>
      <MusicModule
        config={{ mode: 'practice', allowHints: true }}
        onEvent={(event) => console.log('Event:', event)}
      />
      {showDisclaimer && (
        <DisclaimerDialog onClose={() => setShowDisclaimer(false)} />
      )}
    </>
  );
};

export default App;
