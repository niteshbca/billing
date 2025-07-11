const express = require('express');
const router = express.Router();
const Bill = require('../models/bill.model');
const Customer = require('../models/customer.model');
const Item = require('../models/item.model');

// Get all bills
router.route('/').get((req, res) => {
  Bill.find()
    .populate('customerId', 'name')
    .then(bills => res.json(bills))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Get items for a specific customer
router.route('/customer/:customerId/items').get(async (req, res) => {
  try {
    const items = await Item.find({ customerId: req.params.customerId });
    res.json(items);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// Get bills for a specific customer
router.route('/customer/:customerId/bills').get(async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(bills);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// Create new bill
router.route('/add').post(async (req, res) => {
  try {
    const { customerId, customerName, items, totalAmount, priceType } = req.body;
    
    // Generate bill number (you can customize this logic)
    const billCount = await Bill.countDocuments();
    const billNumber = `BILL-${String(billCount + 1).padStart(4, '0')}`;
    
    const newBill = new Bill({
      customerId,
      customerName,
      items,
      totalAmount,
      priceType: priceType || 'price',
      billNumber
    });

    const savedBill = await newBill.save();
    res.json('Bill added!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// Get bill by id
router.route('/:id').get((req, res) => {
  Bill.findById(req.params.id)
    .populate('customerId', 'name address gstNo phoneNumber')
    .then(bill => res.json(bill))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router; 