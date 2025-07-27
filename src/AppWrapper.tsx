import React, { useState } from 'react';
import LandingPage from './LandingPage';
import MainApp from './MainApp';

const AppWrapper: React.FC = () => {
  const [showMainApp, setShowMainApp] = useState(false);

  const handleEnterApp = () => {
    setShowMainApp(true);
  };

  const handleBackToLanding = () => {
    setShowMainApp(false);
  };

  if (showMainApp) {
    return <MainApp onBackToLanding={handleBackToLanding} />;
  }

  return <LandingPage onEnterApp={handleEnterApp} />;
};

export default AppWrapper; 