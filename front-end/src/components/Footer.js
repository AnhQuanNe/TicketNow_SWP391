import React from "react";

function Footer() {
    return (
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <h3>TicketNow</h3>
            <p>© 2025 TicketNow. All rights reserved.</p>
          </div>
          <div className="footer-right">
          <h4>Liên hệ</h4>
            <p>Email: support@ticketnow.com</p>
            <p>Hotline: 0123 456 789</p>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                <img src="/img/fb.jpg" alt="Facebook" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }
  export default Footer;
  