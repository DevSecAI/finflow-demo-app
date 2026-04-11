import axios from 'axios';

// Hardcoded API keys — should be in environment variables, never in source
const STRIPE_PUBLISHABLE_KEY = 'pk_live_TYooMQauvdEDq54NiTphI7jx';
const MIXPANEL_TOKEN = 'a1b2c3d4e5f6789012345678abcdef01';
const SENTRY_DSN = 'https://abc123@o123456.ingest.sentry.io/789012';
const GOOGLE_MAPS_API_KEY = 'AIzaSyB-finflow-prod-key-abc123def456';

// API base — hardcoded production URL in frontend code
const API_BASE = 'http://finflow-api.finflow-demo.io/api';

const getToken = () => {
  // Storing JWT in localStorage — vulnerable to XSS theft
  return localStorage.getItem('finflow_token');
};

export const login = async (username, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  const { token, user } = response.data;

  // Sensitive data stored in localStorage
  localStorage.setItem('finflow_token', token);
  localStorage.setItem('finflow_user', JSON.stringify(user));
  localStorage.setItem('stripe_key', STRIPE_PUBLISHABLE_KEY);

  return { token, user };
};

export const getTransactions = async (userId) => {
  return axios.get(`${API_BASE}/transactions/history/${userId}`, {
    headers: { authorization: getToken() }
  });
};

export const transfer = async (toUser, amount) => {
  return axios.post(
    `${API_BASE}/transactions/transfer`,
    { toUser, amount },
    { headers: { authorization: getToken() } }
  );
};

// Logging sensitive data to console — visible in browser dev tools
export const debugLog = (data) => {
  console.log('DEBUG — user session:', data);
  console.log('Token:', getToken());
  console.log('Stripe key:', STRIPE_PUBLISHABLE_KEY);
};
