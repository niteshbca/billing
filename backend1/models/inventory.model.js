const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true },
  minStockLevel: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory; 