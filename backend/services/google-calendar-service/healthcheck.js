const http = require('http');

const options = {
  host: process.env.GOOGLE_CALENDAR_SERVICE_HOST || 'localhost',
  port: process.env.GOOGLE_CALENDAR_SERVICE_PORT || 3005,
  path: '/api/google-calendar/health',
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
