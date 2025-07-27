import React from 'react';
import './LandingPage.css';
import logo from './img/logo192.png';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="landing-page">
      {/* Header Bar */}
      <header className="landing-header">
        <div className="logo-section">
          <div className="logo-icon">
            <img src={logo} alt="Inlight Logo" className="logo-image" />
          </div>
          <span className="logo-text">Inlight</span>
        </div>
        
        <div className="header-cta">
          <button
            onClick={onEnterApp}
            className="header-button"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Launch App
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="landing-container">
          {/* Hero Section */}
          <div className="landing-hero">
            <div className="landing-hero-content">
              <h1 className="landing-title">
                Advanced 3D Sunlight Visualization
              </h1>
              <p className="landing-subtitle">
                Professional-grade platform for architectural and environmental analysis with real-time 3D model visualization
              </p>
              <ul className="hero-features">
                <li>Real-time 3D model visualization</li>
                <li>Accurate sunlight and shadow analysis</li>
                <li>Weather integration and solar radiation data</li>
                <li>Professional-grade mapping technology</li>
              </ul>
            </div>
          </div>

          {/* Content Section */}
          <div className="landing-content">
            <div className="content-section">
              <h2 className="section-title">Key Features</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon upload">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>Upload & Visualize</h3>
                    <p>Import your 3D models (GLB, GLTF, OBJ) and visualize them in a geo-accurate environment with precise positioning and scaling.</p>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon visualize">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>Sunlight Analysis</h3>
                    <p>Analyze how sunlight moves through your space over time, with accurate shadow casting and solar radiation calculations.</p>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon weather">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>Weather Integration</h3>
                    <p>Access real-time weather data and integrate environmental conditions into your 3D visualization for comprehensive analysis.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="cta-section">
              <button
                onClick={onEnterApp}
                className="cta-button"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch App
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p><strong>Powered by</strong> ArcGIS Maps SDK for JavaScript</p>
        <p>Built with React & TypeScript • Professional 3D Visualization</p>
        <p><strong>Made by</strong> Arraydiant from ESRI</p>
      </footer>
    </div>
  );
};

export default LandingPage; 