const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventory.model');

// Get all inventory items
router.route('/').get((req, res) => {
  Inventory.find()
    .then(inventory => res.json(inventory))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Add new inventory item
router.route('/add').post((req, res) => {
  const { itemName, quantity, price, description, category, minStockLevel } = req.body;

  const newInventory = new Inventory({
    itemName,
    quantity,
    price,
    description,
    category,
    minStockLevel
  });

  newInventory.save()
    .then(() => res.json('Inventory item added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Get inventory item by id
router.route('/:id').get((req, res) => {
  Inventory.findById(req.params.id)
    .then(inventory => res.json(inventory))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Update inventory item
router.route('/update/:id').post((req, res) => {
  Inventory.findById(req.params.id)
    .then(inventory => {
      inventory.itemName = req.body.itemName;
      inventory.quantity = req.body.quantity;
      inventory.price = req.body.price;
      inventory.description = req.body.description;
      inventory.category = req.body.category;
      inventory.minStockLevel = req.body.minStockLevel;
      inventory.lastUpdated = Date.now();

      inventory.save()
        .then(() => res.json('Inventory updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Delete inventory item
router.route('/:id').delete((req, res) => {
  Inventory.findByIdAndDelete(req.params.id)
    .then(() => res.json('Inventory item deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Update quantity (increase/decrease)
router.route('/update-quantity/:id').post((req, res) => {
  const { action, amount } = req.body; // action: 'increase' or 'decrease'
  
  Inventory.findById(req.params.id)
    .then(inventory => {
      if (action === 'increase') {
        inventory.quantity += amount;
      } else if (action === 'decrease') {
        inventory.quantity = Math.max(0, inventory.quantity - amount);
      }
      inventory.lastUpdated = Date.now();

      inventory.save()
        .then(() => res.json('Quantity updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Check inventory availability for billing items
router.route('/check-availability').post((req, res) => {
  const { items } = req.body; // items: [{itemName, quantity}]
  
  const availabilityResults = [];
  
  Promise.all(items.map(async (item) => {
    const inventoryItem = await Inventory.findOne({ itemName: item.itemName });
    
    if (!inventoryItem) {
      availabilityResults.push({
        itemName: item.itemName,
        requestedQuantity: item.quantity,
        availableQuantity: 0,
        status: 'Not Available',
        message: 'Item not found in inventory'
      });
    } else if (inventoryItem.quantity >= item.quantity) {
      availabilityResults.push({
        itemName: item.itemName,
        requestedQuantity: item.quantity,
        availableQuantity: inventoryItem.quantity,
        status: 'Complete',
        message: 'Available in inventory'
      });
    } else {
      availabilityResults.push({
        itemName: item.itemName,
        requestedQuantity: item.quantity,
        availableQuantity: inventoryItem.quantity,
        status: 'Not Available',
        message: `Available: ${inventoryItem.quantity} ${item.itemName}`
      });
    }
  })).then(() => {
    res.json(availabilityResults);
  }).catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router; 