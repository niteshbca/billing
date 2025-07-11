import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 0,
    price: 0,
    description: '',
    category: '',
    minStockLevel: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/inventory/`)
      .then(response => {
        setInventory(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'price' || name === 'minStockLevel' ? Number(value) : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update existing item
      axios.post(`${process.env.REACT_APP_API_URL}/inventory/update/${editingItem._id}`, formData)
        .then(() => {
          alert('Inventory item updated!');
          setEditingItem(null);
          setFormData({
            itemName: '',
            quantity: 0,
            price: 0,
            description: '',
            category: '',
            minStockLevel: 0
          });
          fetchInventory();
        })
        .catch((error) => {
          console.log(error);
          alert('Error updating item');
        });
    } else {
      // Add new item
      axios.post(`${process.env.REACT_APP_API_URL}/inventory/add`, formData)
        .then(() => {
          alert('Inventory item added!');
          setFormData({
            itemName: '',
            quantity: 0,
            price: 0,
            description: '',
            category: '',
            minStockLevel: 0
          });
          fetchInventory();
        })
        .catch((error) => {
          console.log(error);
          alert('Error adding item');
        });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
      description: item.description || '',
      category: item.category || '',
      minStockLevel: item.minStockLevel || 0
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      axios.delete(`${process.env.REACT_APP_API_URL}/inventory/${id}`)
        .then(() => {
          alert('Item deleted!');
          fetchInventory();
        })
        .catch((error) => {
          console.log(error);
          alert('Error deleting item');
        });
    }
  };

  const handleQuantityChange = (id, action, amount = 1) => {
    axios.post(`${process.env.REACT_APP_API_URL}/inventory/update-quantity/${id}`, { action, amount })
      .then(() => {
        fetchInventory();
      })
      .catch((error) => {
        console.log(error);
        alert('Error updating quantity');
      });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setFormData({
      itemName: '',
      quantity: 0,
      price: 0,
      description: '',
      category: '',
      minStockLevel: 0
    });
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <h2 className="mb-4">Inventory Management</h2>
          
          {/* Add/Edit Form */}
          <div className="card mb-4">
            <div className="card-header">
              <h5>{editingItem ? 'Edit Item' : 'Add New Item'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Min Stock Level</label>
                    <input
                      type="number"
                      className="form-control"
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                  {editingItem && (
                    <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Inventory List */}
          <div className="card">
            <div className="card-header">
              <h5>Current Inventory</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Min Stock</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item._id}>
                        <td>{item.itemName}</td>
                        <td>{item.category || '-'}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleQuantityChange(item._id, 'decrease')}
                            >
                              -
                            </button>
                            <span className="fw-bold">{item.quantity}</span>
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleQuantityChange(item._id, 'increase')}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>₹{item.price}</td>
                        <td>{item.minStockLevel}</td>
                        <td>{new Date(item.lastUpdated).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-warning btn-sm"
                              onClick={() => handleEdit(item)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inventory; 