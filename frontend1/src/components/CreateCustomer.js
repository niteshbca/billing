import React, { useState } from 'react';
import axios from 'axios';

function CreateCustomer() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();

    const newCustomer = {
      name,
      address,
      gstNo,
      phoneNumber
    };

    console.log(newCustomer);

    axios.post('http://localhost:5000/customers/add', newCustomer)
      .then(res => console.log(res.data));
    
    window.location = '/';
  }

  return (
    <div>
      <h3>Create New Customer</h3>
      <form onSubmit={onSubmit}>
        <div className="form-group"> 
          <label>Name: </label>
          <input  type="text"
              required
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              />
        </div>
        <div className="form-group"> 
          <label>Address: </label>
          <input  type="text"
              required
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              />
        </div>
        <div className="form-group">
          <label>GST No.: </label>
          <input 
              type="text" 
              className="form-control"
              value={gstNo}
              onChange={(e) => setGstNo(e.target.value)}
              />
        </div>
        <div className="form-group">
          <label>Phone Number: </label>
          <input 
              type="text" 
              className="form-control"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              />
        </div>
        <div className="form-group">
          <input type="submit" value="Create Customer" className="btn btn-primary" />
        </div>
      </form>
    </div>
  )
}

export default CreateCustomer; 