const router = require('express').Router();
let Customer = require('../models/customer.model');

// Get all customers
router.route('/').get((req, res) => {
  Customer.find()
    .then(customers => res.json(customers))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Add a new customer
router.route('/add').post((req, res) => {
  const { name, address, gstNo, phoneNumber } = req.body;

  const newCustomer = new Customer({
    name,
    address,
    gstNo,
    phoneNumber,
  });

  newCustomer.save()
    .then(() => res.json('Customer added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Get a single customer by ID
router.route('/:id').get((req, res) => {
  Customer.findById(req.params.id)
    .then(customer => res.json(customer))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router; 