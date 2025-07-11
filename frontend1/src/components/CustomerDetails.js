import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// A component to display and edit a single item
const Item = ({ item, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [updatedItem, setUpdatedItem] = useState({ ...item });

    const handleUpdate = () => {
        onUpdate(item._id, updatedItem);
        setIsEditing(false);
    };

    return (
        <tr>
            <td>{isEditing ? <input type="text" value={updatedItem.srNo} onChange={(e) => setUpdatedItem({ ...updatedItem, srNo: e.target.value })} /> : item.srNo}</td>
            <td>{isEditing ? <input type="text" value={updatedItem.name} onChange={(e) => setUpdatedItem({ ...updatedItem, name: e.target.value })} /> : item.name}</td>
            <td>{isEditing ? <input type="number" value={updatedItem.price} onChange={(e) => setUpdatedItem({ ...updatedItem, price: e.target.value })} /> : item.price}</td>
            <td>{isEditing ? <input type="number" value={updatedItem.masterPrice} onChange={(e) => setUpdatedItem({ ...updatedItem, masterPrice: e.target.value })} /> : item.masterPrice}</td>
            <td>
                {isEditing ? (
                    <button onClick={handleUpdate}>Save</button>
                ) : (
                    <button onClick={() => setIsEditing(true)}>Edit</button>
                )}
                <button onClick={() => onDelete(item._id)}>Delete</button>
            </td>
        </tr>
    );
};

// Component to display bill history
const BillHistory = ({ bills, customer }) => {
    const downloadBillPDF = async (bill) => {
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
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${customer.name}</p>
                            <p style="margin: 5px 0;"><strong>GST No:</strong> ${customer.gstNo}</p>
                            <p style="margin: 5px 0;"><strong>Address:</strong> ${customer.address}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phoneNumber}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 5px 0;"><strong>Bill No:</strong> ${bill.billNumber}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Price Type:</strong> ${bill.priceType === 'masterPrice' ? 'Master Price' : 'Regular Price'}</p>
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
                            ${bill.items.map(item => `
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
                        <h2 style="color: #2c3e50; margin: 0;">Total Amount: ₹${bill.totalAmount}</h2>
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
            
            pdf.save(`bill_${customer.name}_${bill.billNumber}_${new Date(bill.createdAt).toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    if (bills.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>Bill History</h3>
                </div>
                <div className="card-body">
                    <p className="text-muted">No bills generated yet for this customer.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3>Bill History</h3>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Bill Number</th>
                                <th>Date</th>
                                <th>Items Count</th>
                                <th>Total Amount</th>
                                <th>Price Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill._id}>
                                    <td>{bill.billNumber}</td>
                                    <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                                    <td>{bill.items.length}</td>
                                    <td>₹{bill.totalAmount}</td>
                                    <td>
                                        <span className={`badge ${bill.priceType === 'masterPrice' ? 'bg-warning' : 'bg-info'}`}>
                                            {bill.priceType === 'masterPrice' ? 'Master Price' : 'Regular Price'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => downloadBillPDF(bill)}
                                        >
                                            Download PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

function CustomerDetails() {
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  // Excel upload state
  const [excelData, setExcelData] = useState([]);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  
  // Form state for new item
  const [srNo, setSrNo] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [masterPrice, setMasterPrice] = useState('');

  const { id } = useParams();

  const fetchItems = useCallback(async () => {
    try {
      const itemsRes = await axios.get(`${process.env.REACT_APP_API_URL}/items/${id}`);
      setItems(itemsRes.data);
    } catch (error) {
      console.log("Error fetching items", error);
    }
  }, [id]);

  const fetchBills = useCallback(async () => {
    try {
      const billsRes = await axios.get(`${process.env.REACT_APP_API_URL}/bills/customer/${id}/bills`);
      setBills(billsRes.data);
    } catch (error) {
      console.log("Error fetching bills", error);
    }
  }, [id]);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setLoading(true);
      try {
        const customerRes = await axios.get(`${process.env.REACT_APP_API_URL}/customers/${id}`);
        setCustomer(customerRes.data);
        await Promise.all([fetchItems(), fetchBills()]);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };

    fetchCustomerDetails();
  }, [id, fetchItems, fetchBills]);

  const handleAddItem = (e) => {
    e.preventDefault();
    const newItem = {
        srNo, name, price, masterPrice, customerId: id
    };
    axios.post(`${process.env.REACT_APP_API_URL}/items/add`, newItem)
        .then(res => {
            console.log(res.data);
            fetchItems(); // Refetch items to show the new one
            // Clear form
            setSrNo('');
            setName('');
            setPrice('');
            setMasterPrice('');
        })
        .catch(err => console.log(err));
  };

  const handleDeleteItem = (itemId) => {
    axios.delete(`${process.env.REACT_APP_API_URL}/items/${itemId}`)
        .then(res => {
            console.log(res.data);
            fetchItems(); // Refetch
        })
        .catch(err => console.log(err));
  };

  const handleUpdateItem = (itemId, updatedItem) => {
      axios.post(`${process.env.REACT_APP_API_URL}/items/update/${itemId}`, updatedItem)
        .then(res => {
            console.log(res.data);
            fetchItems(); // Refetch
        })
        .catch(err => console.log(err));
  };

  // Excel Download Handler
  const handleDownloadExcel = () => {
    if (!items.length) return;
    const ws = XLSX.utils.json_to_sheet(items.map(({ _id, customerId, ...rest }) => rest));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, `${customer.name}_items.xlsx`);
  };

  // Excel Upload Handler
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    setExcelFileName(file?.name || '');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setExcelData(data);
      setShowExcelPreview(true);
    };
    reader.readAsBinaryString(file);
  };

  // Save Excel Data to Backend
  const handleSaveExcelData = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/items/bulk-update/${customer._id}`, { items: excelData });
      setShowExcelPreview(false);
      setExcelData([]);
      setExcelFileName('');
      await fetchItems();
      alert('Items updated successfully!');
    } catch (err) {
      alert('Error updating items from Excel');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!customer) {
    return <p>Customer not found.</p>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          {/* Customer Information */}
          <div className="card mb-4">
            <div className="card-header">
      <h2>{customer.name}</h2>
            </div>
            <div className="card-body">
      <p><strong>Address:</strong> {customer.address}</p>
      <p><strong>GST No:</strong> {customer.gstNo}</p>
      <p><strong>Phone:</strong> {customer.phoneNumber}</p>
            </div>
          </div>

          <hr className="my-4" />

          {/* Excel Download/Upload Buttons */}
          <div className="mb-3 d-flex align-items-center gap-3">
            <button className="btn btn-success" onClick={handleDownloadExcel} disabled={!items.length}>
              Download Excel
            </button>
            <label className="btn btn-secondary mb-0">
              Upload Excel
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
            </label>
            {excelFileName && <span className="text-muted">{excelFileName}</span>}
          </div>

          {/* Excel Preview and Save Button */}
          {showExcelPreview && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Excel Preview</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        {Object.keys(excelData[0] || {}).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, i) => (
                            <td key={i}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-primary mt-2" onClick={handleSaveExcelData}>
                  Save
                </button>
                <button className="btn btn-link mt-2 ms-2" onClick={() => setShowExcelPreview(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add New Item Section */}
          <div className="card mb-4">
            <div className="card-header">
      <h3>Add New Item</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddItem} className="row g-3">
                <div className="col-md-2">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Sr.No" 
                    value={srNo} 
                    onChange={e => setSrNo(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-2">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Price" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-2">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Master Price" 
                    value={masterPrice} 
                    onChange={e => setMasterPrice(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-2">
                  <button type="submit" className="btn btn-primary">Add Item</button>
                </div>
      </form>
            </div>
          </div>

          {/* Items Table */}
          <div className="card mb-4">
            <div className="card-header">
      <h3>Items</h3>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
          <tr>
            <th>Sr.No</th>
            <th>Name</th>
            <th>Price</th>
            <th>Master Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <Item item={item} onDelete={handleDeleteItem} onUpdate={handleUpdateItem} key={item._id} />
          ))}
        </tbody>
      </table>
              </div>
            </div>
          </div>

          {/* Bill History Section */}
          <BillHistory bills={bills} customer={customer} />
        </div>
      </div>
    </div>
  );
}

export default CustomerDetails; 