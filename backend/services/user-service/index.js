const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'user-service' });
});

app.get('/api/v1/users', (req, res) => {
  res.status(401).json({ error: 'Unauthorized' });
});

app.listen(port, () => {
  console.log(`User Service running on port ${port}`);
});
