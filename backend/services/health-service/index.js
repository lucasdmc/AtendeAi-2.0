const express = require('express');
const app = express();
const port = process.env.PORT || 3004;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'health-service' });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'health-service' });
});

app.listen(port, () => {
  console.log(`Health Service running on port ${port}`);
});
