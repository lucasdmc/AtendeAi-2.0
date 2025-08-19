const http = require('http');

const options = {
  host: process.env.APPOINTMENT_SERVICE_HOST || 'localhost',
  port: process.env.APPOINTMENT_SERVICE_PORT || 3002,
  path: '/api/appointment/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});

request.end();
