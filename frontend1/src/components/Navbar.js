import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMobileMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/customers" className="navbar-logo" onClick={closeMobileMenu}>
          Bill App
        </Link>
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {/* Using simple icons to avoid dependencies */}
          {isOpen ? '✖' : '☰'}
        </div>
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/customers" className="nav-links" onClick={closeMobileMenu}>
              Customers
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/inventory" className="nav-links" onClick={closeMobileMenu}>
              Inventory
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/billing" className="nav-links" onClick={closeMobileMenu}>
              Billing
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 