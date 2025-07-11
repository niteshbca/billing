import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import './Billing.css'; // Import the new stylesheet

function Billing() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerItems, setCustomerItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [inventoryStatus, setInventoryStatus] = useState([]);
  const [showInventoryStatus, setShowInventoryStatus] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [priceType, setPriceType] = useState('price'); // 'price' or 'masterPrice'
  const [upiId, setUpiId] = useState('your-upi-id@bank'); // Default UPI ID
  const [showUpiInput, setShowUpiInput] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const navigate = useNavigate();
  const billRef = useRef();

  // Fetch all customers
  useEffect(() => {
    axios.get('http://localhost:5000/customers/')
      .then(response => {
        setCustomers(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // Fetch items when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      axios.get(`http://localhost:5000/bills/customer/${selectedCustomer}/items`)
        .then(response => {
          setCustomerItems(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [selectedCustomer]);

  // Calculate total amount when selected items change
  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => sum + item.total, 0);
    setTotalAmount(total);
  }, [selectedItems]);

  const handleCustomerChange = (e) => {
    setSelectedCustomer(e.target.value);
    setSelectedItems([]);
    setShowInventoryStatus(false);
    setShowQRCode(false);
  };

  const handlePriceTypeChange = (e) => {
    setPriceType(e.target.value);
    // Recalculate totals with new price type
    const updatedItems = selectedItems.map(item => {
      const selectedPrice = e.target.value === 'masterPrice' ? item.masterPrice : item.price;
      return {
        ...item,
        selectedPrice: selectedPrice,
        total: item.quantity * selectedPrice
      };
    });
    setSelectedItems(updatedItems);
  };

  const addItemToBill = (item) => {
    const existingItem = selectedItems.find(selected => selected.itemId === item._id);
    const selectedPrice = priceType === 'masterPrice' ? item.masterPrice : item.price;
    
    if (existingItem) {
      // If item already exists, increase quantity
      const updatedItems = selectedItems.map(selected => 
        selected.itemId === item._id 
          ? { 
              ...selected, 
              quantity: selected.quantity + 1, 
              selectedPrice: selectedPrice,
              total: (selected.quantity + 1) * selectedPrice 
            }
          : selected
      );
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        itemId: item._id,
        itemName: item.name,
        price: item.price,
        masterPrice: item.masterPrice,
        selectedPrice: selectedPrice,
        quantity: 1,
        total: selectedPrice
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const increaseQuantity = (itemId) => {
    const updatedItems = selectedItems.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.selectedPrice }
        : item
    );
    setSelectedItems(updatedItems);
  };

  const decreaseQuantity = (itemId) => {
    const updatedItems = selectedItems.map(item => {
      if (item.itemId === itemId) {
        const newQuantity = Math.max(0, item.quantity - 1);
        return { ...item, quantity: newQuantity, total: newQuantity * item.selectedPrice };
      }
      return item;
    }).filter(item => item.quantity > 0); // Remove items with quantity 0
    setSelectedItems(updatedItems);
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
  };

  const checkInventory = async () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the bill first');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/inventory/check-availability', {
        items: selectedItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity
        }))
      });
      setInventoryStatus(response.data);
      setShowInventoryStatus(true);
    } catch (error) {
      console.log(error);
      alert('Error checking inventory');
    }
  };

  const downloadPDF = async () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the bill first');
      return;
    }

    const selectedCustomerData = customers.find(c => c._id === selectedCustomer);
    
    try {
      // Create a temporary div for PDF generation
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.color = 'black';
      pdfContent.style.width = '800px';
      
      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">INVOICE</h1>
          <div style="border-bottom: 2px solid #3498db; width: 100px; margin: 0 auto;"></div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h3 style="color: #2c3e50; margin-bottom: 10px;">Bill To:</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${selectedCustomerData.name}</p>
              <p style="margin: 5px 0;"><strong>GST No:</strong> ${selectedCustomerData.gstNo}</p>
              <p style="margin: 5px 0;"><strong>Address:</strong> ${selectedCustomerData.address}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${selectedCustomerData.phoneNumber}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Price Type:</strong> ${priceType === 'masterPrice' ? 'Master Price' : 'Regular Price'}</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Price (₹)</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${selectedItems.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 12px;">${item.itemName}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.selectedPrice}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="text-align: right; margin-top: 30px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; display: inline-block;">
            <h2 style="color: #2c3e50; margin: 0;">Total Amount: ₹${totalAmount}</h2>
          </div>
        </div>
        
        <div style="margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>Thank you for your business!</p>
        </div>
      `;
      
      document.body.appendChild(pdfContent);
      
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(pdfContent);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`bill_${selectedCustomerData.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const shareQRCodeOnWhatsApp = async () => {
    if (!qrCodeImage) {
      alert('Please generate a QR Code first.');
      return;
    }

    try {
      const response = await fetch(qrCodeImage);
      const blob = await response.blob();
      const file = new File([blob], 'qrcode.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Payment QR Code',
          text: `Scan this QR code to pay ₹${totalAmount}`,
        });
      } else {
        const link = document.createElement('a');
        link.href = qrCodeImage;
        link.download = 'qrcode.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Web Share API not supported. QR Code downloaded. Please share manually.');
      }
    } catch (error) {
      console.error('Error sharing QR Code:', error);
      alert('Could not share QR Code.');
    }
  };

  const generatePaymentQR = async () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the bill first');
      return;
    }

    try {
      setIsGeneratingQR(true);
    // Generate UPI payment link
    const paymentLink = `upi://pay?pa=${upiId}&pn=Payment&am=${totalAmount}&cu=INR&tn=Bill Payment`;
    
    setQrCodeData(paymentLink);
      
      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(paymentLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeImage(qrCodeDataURL);
    setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error generating QR code. Please try again.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleSubmitBill = async () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the bill');
      return;
    }

    const selectedCustomerData = customers.find(c => c._id === selectedCustomer);
    
    try {
      await axios.post('http://localhost:5000/bills/add', {
        customerId: selectedCustomer,
        customerName: selectedCustomerData.name,
        items: selectedItems,
        totalAmount: totalAmount,
        priceType: priceType
      });
      
      alert('Bill created successfully!');
      navigate(`/customer/${selectedCustomer}`);
    } catch (error) {
      console.log(error);
      alert('Error creating bill');
    }
  };

  return (
    <div className="billing-container">
      <div className="row">
        <div className="col-md-12">
          <h2 className="mb-4">Create New Bill</h2>
          
          {/* Customer Selection */}
          <div className="card mb-4">
            <div className="card-header">
              <h5>Select Customer</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
              <select 
                className="form-select" 
                value={selectedCustomer} 
                onChange={handleCustomerChange}
              >
                <option value="">Choose a customer...</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} - {customer.gstNo}
                  </option>
                ))}
              </select>
                </div>
                <div className="col-md-4">
                  {selectedCustomer && (
                    <button 
                      className="btn btn-outline-info"
                      onClick={() => navigate(`/customer/${selectedCustomer}`)}
                    >
                      View Bill History
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Price Type Selection */}
          {selectedCustomer && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Select Price Type</h5>
              </div>
              <div className="card-body">
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="priceType"
                    id="regularPrice"
                    value="price"
                    checked={priceType === 'price'}
                    onChange={handlePriceTypeChange}
                  />
                  <label className="form-check-label" htmlFor="regularPrice">
                    Regular Price
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="priceType"
                    id="masterPrice"
                    value="masterPrice"
                    checked={priceType === 'masterPrice'}
                    onChange={handlePriceTypeChange}
                  />
                  <label className="form-check-label" htmlFor="masterPrice">
                    Master Price
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Available Items */}
          {selectedCustomer && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Available Items</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {customerItems.map(item => (
                    <div key={item._id} className="col-md-4 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">{item.name}</h6>
                          <p className="card-text">
                            <strong>Regular Price:</strong> ₹{item.price}<br/>
                            <strong>Master Price:</strong> ₹{item.masterPrice}
                          </p>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => addItemToBill(item)}
                          >
                            Add to Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Bill Items</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Price Type</th>
                        <th>Price (₹)</th>
                        <th>Quantity</th>
                        <th>Total (₹)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map(item => {
                        // Find inventory status for this item
                        const itemInventoryStatus = inventoryStatus.find(
                          invItem => invItem.itemName === item.itemName
                        );
                        
                        return (
                          <React.Fragment key={item.itemId}>
                            {/* Main item row */}
                            <tr>
                              <td>{item.itemName}</td>
                              <td>
                                <span className={`badge ${priceType === 'masterPrice' ? 'bg-warning' : 'bg-info'}`}>
                                  {priceType === 'masterPrice' ? 'Master Price' : 'Regular Price'}
                                </span>
                              </td>
                              <td>₹{item.selectedPrice}</td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button 
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => decreaseQuantity(item.itemId)}
                                  >
                                    -
                                  </button>
                                  <span className="btn btn-outline-secondary btn-sm disabled">
                                    {item.quantity}
                                  </span>
                                  <button 
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => increaseQuantity(item.itemId)}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td>₹{item.total}</td>
                              <td>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeItem(item.itemId)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                            
                            {/* Inventory status row (shown when inventory is checked) */}
                            {showInventoryStatus && itemInventoryStatus && (
                              <tr>
                                <td colSpan="6">
                                  <div className="table-responsive">
                                    <table className="table inventory-status-table mb-0">
                                      <thead>
                                        <tr>
                                          <th>Item Name</th>
                                          <th>Available Qty</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td>{itemInventoryStatus.itemName}</td>
                                          <td>{itemInventoryStatus.availableQuantity}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Total Amount */}
                <div className="row">
                  <div className="col-md-6 offset-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">Total Amount: ₹{totalAmount}</h5>
                        <small className="text-muted">
                          Using {priceType === 'masterPrice' ? 'Master Price' : 'Regular Price'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="row mt-3">
                  <div className="col-md-12 text-center">
                    <button 
                      className={`btn me-2 ${showInventoryStatus ? 'btn-success' : 'btn-info'}`}
                      onClick={checkInventory}
                    >
                      {showInventoryStatus ? '✓ Inventory Checked' : 'Check Inventory'}
                    </button>
                    <button 
                      className="btn btn-warning me-2"
                      onClick={downloadPDF}
                    >
                      Download Bill PDF
                    </button>
                    <button 
                      className="btn btn-primary me-2"
                      onClick={generatePaymentQR}
                      disabled={isGeneratingQR}
                    >
                      {isGeneratingQR ? 'Generating QR Code...' : 'Generate Payment Link'}
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={handleSubmitBill}
                    >
                      Generate Bill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          {showQRCode && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Payment QR Code</h5>
              </div>
              <div className="card-body text-center">
                <div className="mb-3">
                  <p><strong>Amount:</strong> ₹{totalAmount}</p>
                  <p>Scan this QR code to make payment</p>
                  
                  {/* UPI ID Configuration */}
                  <div className="mb-3">
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setShowUpiInput(!showUpiInput)}
                    >
                      {showUpiInput ? 'Hide' : 'Configure'} UPI ID
                    </button>
                    
                    {showUpiInput && (
                      <div className="mt-2">
                        <div className="row justify-content-center">
                          <div className="col-md-6">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter UPI ID (e.g., yourname@bank)"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                              />
                              <button 
                                className="btn btn-primary"
                                onClick={generatePaymentQR}
                              >
                                Update QR Code
                              </button>
                            </div>
                            <small className="text-muted">Format: yourname@bank or yourname@upi</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border p-3 d-inline-block">
                  <div style={{ width: '200px', height: '200px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {qrCodeImage ? (
                      <img src={qrCodeImage} alt="Payment QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span className="text-muted">Generating QR Code...</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-muted">
                    <strong>Payment Link:</strong> {qrCodeData}
                  </p>
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(qrCodeData);
                        alert('Payment link copied to clipboard!');
                      }}
                    >
                      Copy Payment Link
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={shareQRCodeOnWhatsApp}
                    >
                      📱 Send on WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Billing; 