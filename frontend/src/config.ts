// src/config.ts

const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'),
};

// Debug logging
console.log('Config loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  API_BASE_URL: config.API_BASE_URL
});

export default config;

