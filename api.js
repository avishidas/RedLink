// api.js - Frontend API Integration (Updated - No localStorage)

const API_BASE_URL = 'http://localhost:5000/api';

// Store token in memory instead of localStorage
let authToken = null;

// ==================== HELPER FUNCTIONS ====================

function setAuthToken(token) {
  authToken = token;
  // Store in sessionStorage as fallback (will persist during session only)
  try {
    sessionStorage.setItem('token', token);
  } catch (e) {
    console.warn('Session storage not available');
  }
}

function getAuthToken() {
  if (authToken) return authToken;
  
  // Try to restore from sessionStorage if available
  try {
    authToken = sessionStorage.getItem('token');
    return authToken;
  } catch (e) {
    return null;
  }
}

function getAuthHeaders() {
  const token = getAuthToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API response error:', data);
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== AUTHENTICATION ====================

async function signup(userData) {
  const data = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
}

async function login(credentials) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
}

function logout() {
  authToken = null;
  try {
    sessionStorage.removeItem('token');
  } catch (e) {
    console.warn('Session storage not available');
  }
  window.location.href = 'index.html';
}

// ==================== USER PROFILE ====================

async function getUserProfile() {
  return await apiRequest('/users/profile', {
    headers: getAuthHeaders()
  });
}

async function updateUserProfile(profileData) {
  return await apiRequest('/users/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
}

// ==================== BLOOD BANKS ====================

async function getBloodBanks(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  return await apiRequest(`/bloodbanks?${queryParams}`);
}

async function getBloodBankById(id) {
  return await apiRequest(`/bloodbanks/${id}`);
}

async function getBloodBankInventory(id) {
  return await apiRequest(`/bloodbanks/${id}/inventory`);
}

// ==================== DONATIONS ====================

async function scheduleDonation(donationData) {
  console.log('📦 Scheduling donation payload:', donationData);
  return await apiRequest('/donations', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(donationData)
  });
}

async function getUserDonations() {
  return await apiRequest('/donations', {
    headers: getAuthHeaders()
  });
}

async function completeDonation(donationId) {
  return await apiRequest(`/donations/${donationId}/complete`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
}

// ==================== BLOOD REQUESTS ====================

async function createBloodRequest(requestData) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Only add auth if user is logged in
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return await apiRequest('/requests', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestData)
  });
}

async function getUserRequests() {
  return await apiRequest('/requests', {
    headers: getAuthHeaders()
  });
}

async function getAllRequests(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  return await apiRequest(`/requests/all?${queryParams}`);
}

// ==================== EMERGENCY ALERTS ====================

async function getEmergencyAlerts() {
  return await apiRequest('/alerts');
}

async function createEmergencyAlert(alertData) {
  return await apiRequest('/alerts', {
    method: 'POST',
    body: JSON.stringify(alertData)
  });
}

// ==================== AI PREDICTIONS ====================

async function getShortagesPredictions() {
  return await apiRequest('/predictions/shortages');
}

// ==================== WEBSOCKET CONNECTION ====================

let socket;

function connectWebSocket() {
  socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log('✅ Connected to RedLink server');
  });

  socket.on('emergency-alert', (alert) => {
    console.log('🚨 Emergency Alert:', alert);
    showEmergencyNotification(alert);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });
}

function showEmergencyNotification(alert) {
  const notification = document.createElement('div');
  notification.className = 'emergency-notification';
  notification.innerHTML = `
    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 10px; border-radius: 8px; animation: slideIn 0.3s;">
      <strong>🚨 EMERGENCY ALERT</strong><br>
      ${alert.message}<br>
      <small>Location: ${alert.location}</small>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 10000);

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('RedLink Emergency', {
      body: alert.message,
      icon: '🩸'
    });
  }
}

// ==================== LOCATION SERVICES ====================

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// ==================== INITIALIZATION ====================

function checkAuth() {
  if (!getAuthToken() && window.location.pathname.includes('dashboard.html')) {
    window.location.href = 'index.html';
  }
}

// Request notification permission
if ('Notification' in window) {
  Notification.requestPermission();
}

// Auto-connect WebSocket when page loads
// if (window.location.pathname.includes('dashboard.html')) {
//   connectWebSocket();
//   checkAuth();
// }

// Export functions for use in other files
window.RedLinkAPI = {
  // Auth
  signup,
  login,
  logout,
  getAuthToken,
  
  // User
  getUserProfile,
  updateUserProfile,
  
  // Blood Banks
  getBloodBanks,
  getBloodBankById,
  getBloodBankInventory,
  
  // Donations
  scheduleDonation,
  getUserDonations,
  completeDonation,
  
  // Requests
  createBloodRequest,
  getUserRequests,
  getAllRequests,
  
  // Alerts
  getEmergencyAlerts,
  createEmergencyAlert,
  
  // AI
  getShortagesPredictions,
  
  // Location
  getCurrentLocation,
  
  // WebSocket
  connectWebSocket
};
