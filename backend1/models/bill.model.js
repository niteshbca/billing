const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const billItemSchema = new Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  masterPrice: { type: Number, required: true },
  selectedPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  total: { type: Number, required: true }
});

const billSchema = new Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  items: [billItemSchema],
  totalAmount: { type: Number, required: true },
  priceType: { type: String, enum: ['price', 'masterPrice'], default: 'price' },
  billDate: { type: Date, default: Date.now },
  billNumber: { type: String, required: true, unique: true }
}, {
  timestamps: true,
});

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill; 