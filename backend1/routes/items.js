const router = require('express').Router();
let Item = require('../models/item.model');

// Get all items for a specific customer
router.route('/:customerId').get((req, res) => {
  Item.find({ customerId: req.params.customerId })
    .then(items => res.json(items))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Add a new item
router.route('/add').post((req, res) => {
  const { srNo, name, price, masterPrice, customerId } = req.body;

  const newItem = new Item({
    srNo,
    name,
    price,
    masterPrice,
    customerId
  });

  newItem.save()
    .then(() => res.json('Item added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Update an item
router.route('/update/:id').post((req, res) => {
  Item.findById(req.params.id)
    .then(item => {
      item.srNo = req.body.srNo;
      item.name = req.body.name;
      item.price = req.body.price;
      item.masterPrice = req.body.masterPrice;

      item.save()
        .then(() => res.json('Item updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// Delete an item
router.route('/:id').delete((req, res) => {
  Item.findByIdAndDelete(req.params.id)
    .then(() => res.json('Item deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Bulk update or insert items for a customer from Excel
router.post('/bulk-update/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const items = req.body.items;
    if (!Array.isArray(items)) return res.status(400).json('Invalid items data');

    for (const item of items) {
      // Try to find by srNo and customerId
      let dbItem = await Item.findOne({ srNo: item.srNo, customerId });
      if (dbItem) {
        // Update existing item
        dbItem.name = item.name;
        dbItem.price = item.price;
        dbItem.masterPrice = item.masterPrice;
        await dbItem.save();
      } else {
        // Add new item
        await Item.create({
          srNo: item.srNo,
          name: item.name,
          price: item.price,
          masterPrice: item.masterPrice,
          customerId
        });
      }
    }
    res.json('Bulk update successful');
  } catch (err) {
    res.status(500).json('Bulk update error');
  }
});

module.exports = router; 