const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
  srNo: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  masterPrice: { type: Number, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }
}, {
  timestamps: true,
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item; 