const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const customersRouter = require('./routes/customers');
const itemsRouter = require('./routes/items');
const billsRouter = require('./routes/bills');
const inventoryRouter = require('./routes/inventory');

app.use('/customers', customersRouter);
app.use('/items', itemsRouter);
app.use('/bills', billsRouter);
app.use('/inventory', inventoryRouter);

app.get('/', (req, res) => {
  res.send('Hello from the MERN stack backend!');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
}); 