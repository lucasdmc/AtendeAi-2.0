const http = require('http');

const options = {
  host: process.env.WHATSAPP_SERVICE_HOST || 'localhost',
  port: process.env.WHATSAPP_SERVICE_PORT || 3004,
  path: '/api/whatsapp/health',
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
