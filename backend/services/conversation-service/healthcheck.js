const http = require('http');

const options = {
  host: process.env.CONVERSATION_SERVICE_HOST || 'localhost',
  port: process.env.CONVERSATION_SERVICE_PORT || 3003,
  path: '/api/conversation/health',
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
