import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CustomersList from './components/CustomersList';
import CreateCustomer from './components/CreateCustomer';
import CustomerDetails from './components/CustomerDetails';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import Navbar from './components/Navbar';
import './styles.css'; // Import the new stylesheet

function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/create-customer" element={<CreateCustomer />} />
          <Route path="/customer/:id" element={<CustomerDetails />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/" element={<CustomersList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 