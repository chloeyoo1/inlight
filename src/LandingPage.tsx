import React from 'react';
import './LandingPage.css';
import './LandingPage.css';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Logo/Title Section */}
        <div className="landing-header">
          <h1 className="landing-title">
            Inlight
          </h1>
          <p className="landing-subtitle">
            Interactive 3D Sunlight-to-Room Interaction Visualization Platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h3 className="feature-title">Scan Your Room and Upload</h3>
            <p className="feature-description">Upload and visualize your 3D models in a geo-accurate map.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="feature-title">Visualize Sunlight in Your Room</h3>
            <p className="feature-description">See how the sunlight moves across your space over time, and understand how heat and light affect your room to optimize energy consumption.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="feature-title">Real-time Weather and Solar Radiation</h3>
            <p className="feature-description">Experience dynamic weather conditions and lighting changes so you can plan your space accordingly.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <button
            onClick={onEnterApp}
            className="cta-button"
          >
            Launch Inlight
          </button>
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <p>Powered by ArcGIS Maps SDK for JavaScript</p>
          <p>Built with React & TypeScript</p>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <p><strong>Powered by</strong> ArcGIS Maps SDK for JavaScript</p>
        <p>Built with React & TypeScript • Professional 3D Visualization</p>
      </div>
    </div>
  );
};

export default LandingPage; 