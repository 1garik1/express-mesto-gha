const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const routes = require('./routes');

const { PORT = 3000 } = process.env;
const app = express();

app.use(bodyParser.json());

app.use(routes);

mongoose.connect('mongodb://127.0.0.1/mestodb', {
  useNewUrlParser: true,
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
