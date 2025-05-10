import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-container">
        <p className="copyright">
          &copy; {currentYear} PantryPilot. All rights reserved.
        </p>
        <div className="footer-links">
          <button className="footer-link" onClick={() => window.alert('Privacy Policy')}>Privacy Policy</button>
          <button className="footer-link" onClick={() => window.alert('Terms of Service')}>Terms of Service</button>
          <button className="footer-link" onClick={() => window.alert('Contact Us')}>Contact Us</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
