import React from 'react';
import { RoomProvider } from './context/RoomContext';
import BlueprintDashboard from './components/BlueprintDashboard';

function App() {
  return (
    <RoomProvider>
      <BlueprintDashboard />
    </RoomProvider>
  );
}

export default App;