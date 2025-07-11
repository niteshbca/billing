import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CustomersList.css';

const Customer = props => (
  <div className="customer-card">
    <h3>
      <Link to={"/customer/"+props.customer._id}>{props.customer.name}</Link>
    </h3>
    <p>Address: {props.customer.address}</p>
    <p>GST No: {props.customer.gstNo}</p>
    <p>Phone: {props.customer.phoneNumber}</p>
  </div>
);

function CustomersList() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/customers/`)
      .then(response => {
        setCustomers(response.data);
      })
      .catch((error) => {
        console.log(error);
      })
  }, []);

  function customerList() {
    return customers.map(currentcustomer => {
      return <Customer customer={currentcustomer} key={currentcustomer._id}/>;
    })
  }

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h3>Customers</h3>
        <div>
          <Link to="/inventory" className="btn btn-info me-2">Inventory</Link>
          <Link to="/billing" className="btn btn-success me-2">Create Bill</Link>
          <Link to="/create-customer" className="btn btn-primary">Create New Customer</Link>
        </div>
      </div>
      <div>
        { customerList() }
      </div>
    </div>
  );
}

export default CustomersList; 