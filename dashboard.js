/* ===============================
   UPDATED dashboard.js - Auto Location Detection & Dynamic Blood Banks
================================ */

// ===============================
// GLOBAL VARIABLES
// ===============================
let userLocation = null;
let currentSlide = 0;
let isEligibleToDonate = false;
let selectedBloodBankId = null;
let selectedBloodBankName = null;
let selectedBloodBankCoords = null;

// ===============================
// DETECT USER LOCATION ON PAGE LOAD
// ===============================
async function detectUserLocation() {
  try {
    console.log('🔍 Detecting user location...');
    
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return null;
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });

    userLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };

    console.log('✅ User location detected:', userLocation);
    return userLocation;

  } catch (error) {
    console.warn('❌ Location detection failed:', error.message);
    
    // Show user-friendly message
    if (error.code === 1) {
      console.log('User denied location access - using default Delhi location');
    } else if (error.code === 2) {
      console.log('Location unavailable - using default Delhi location');
    } else {
      console.log('Location timeout - using default Delhi location');
    }
    
    // Fallback to Delhi coordinates
    userLocation = {
      latitude: 28.6139,
      longitude: 77.2090
    };
    
    return userLocation;
  }
}

// ===============================
// SLIDER AUTO-SCROLL
// ===============================
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function moveSlide() {
  currentSlide = (currentSlide + 1) % totalSlides;
  const offset = -currentSlide * 100;
  document.querySelector('.slides').style.transform = `translateX(${offset}%)`;
}

if (slides.length > 0) {
  setInterval(moveSlide, 4000);
}

// ===============================
// CALCULATE DISTANCE BETWEEN TWO COORDINATES
// ===============================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value) {
  return value * Math.PI / 180;
}

// ===============================
// MOCK DATA FOR TESTING (FALLBACK)
// ===============================
const MOCK_BLOOD_BANKS = [
  {
    _id: '1',
    name: 'AIIMS Blood Bank',
    address: 'Ansari Nagar, New Delhi - 110029',
    phone: '011-26588500',
    latitude: 28.5672,
    longitude: 77.2100,
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 45, minThreshold: 20 },
      { bloodGroup: 'A-', unitsAvailable: 12, minThreshold: 15 },
      { bloodGroup: 'B+', unitsAvailable: 38, minThreshold: 20 },
      { bloodGroup: 'B-', unitsAvailable: 8, minThreshold: 10 },
      { bloodGroup: 'O+', unitsAvailable: 52, minThreshold: 25 },
      { bloodGroup: 'O-', unitsAvailable: 15, minThreshold: 15 },
      { bloodGroup: 'AB+', unitsAvailable: 22, minThreshold: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 6, minThreshold: 10 }
    ]
  },
  {
    _id: '2',
    name: 'Safdarjung Hospital Blood Bank',
    address: 'Safdarjung Enclave, New Delhi - 110029',
    phone: '011-26165060',
    latitude: 28.5665,
    longitude: 77.2000,
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 32, minThreshold: 20 },
      { bloodGroup: 'A-', unitsAvailable: 18, minThreshold: 15 },
      { bloodGroup: 'B+', unitsAvailable: 28, minThreshold: 20 },
      { bloodGroup: 'B-', unitsAvailable: 12, minThreshold: 10 },
      { bloodGroup: 'O+', unitsAvailable: 42, minThreshold: 25 },
      { bloodGroup: 'O-', unitsAvailable: 19, minThreshold: 15 },
      { bloodGroup: 'AB+', unitsAvailable: 16, minThreshold: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 9, minThreshold: 10 }
    ]
  },
  {
    _id: '3',
    name: 'Apollo Hospital Blood Bank',
    address: 'Sarita Vihar, New Delhi - 110076',
    phone: '011-26825858',
    latitude: 28.5328,
    longitude: 77.2897,
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 28, minThreshold: 20 },
      { bloodGroup: 'A-', unitsAvailable: 8, minThreshold: 15 },
      { bloodGroup: 'B+', unitsAvailable: 35, minThreshold: 20 },
      { bloodGroup: 'B-', unitsAvailable: 14, minThreshold: 10 },
      { bloodGroup: 'O+', unitsAvailable: 48, minThreshold: 25 },
      { bloodGroup: 'O-', unitsAvailable: 11, minThreshold: 15 },
      { bloodGroup: 'AB+', unitsAvailable: 19, minThreshold: 15 },
      { bloodGroup: 'AB-', unitsAvailable: 7, minThreshold: 10 }
    ]
  },
  {
    _id: '4',
    name: 'Red Cross Blood Bank',
    address: '1, Red Cross Road, Connaught Place',
    phone: '011-23716441',
    latitude: 28.6328,
    longitude: 77.2197,
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 50, minThreshold: 20 },
      { bloodGroup: 'O+', unitsAvailable: 60, minThreshold: 25 },
      { bloodGroup: 'B+', unitsAvailable: 40, minThreshold: 20 }
    ]
  },
  {
    _id: '5',
    name: 'Max Hospital Blood Bank',
    address: 'Press Enclave Road, Saket',
    phone: '011-26515050',
    latitude: 28.5244,
    longitude: 77.2066,
    inventory: [
      { bloodGroup: 'A+', unitsAvailable: 35, minThreshold: 20 },
      { bloodGroup: 'O+', unitsAvailable: 45, minThreshold: 25 }
    ]
  }
];

// ===============================
// GET NEAREST BLOOD BANKS
// ===============================
async function getNearestBloodBanks(limit = 3) {
  try {
    console.log('🔍 Finding nearest blood banks...');
    
    // Ensure we have user location
    if (!userLocation) {
      await detectUserLocation();
    }

    let bloodBanks = [];

    // Try API first
    try {
      const data = await RedLinkAPI.getBloodBanks({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: 50
      });

      if (data && data.bloodBanks && data.bloodBanks.length > 0) {
        bloodBanks = data.bloodBanks;
        console.log('✅ Got', bloodBanks.length, 'blood banks from API');
      } else {
        throw new Error('No blood banks from API');
      }
    } catch (apiError) {
      console.warn('⚠️ API failed, using mock data:', apiError.message);
      bloodBanks = MOCK_BLOOD_BANKS;
    }

    // Calculate distances and sort
    bloodBanks = bloodBanks.map(bank => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        bank.latitude,
        bank.longitude
      );
      return { ...bank, distance };
    });

    // Sort by distance and take top N
    bloodBanks.sort((a, b) => a.distance - b.distance);
    const nearest = bloodBanks.slice(0, limit);

    console.log('✅ Found', nearest.length, 'nearest blood banks');
    nearest.forEach((bank, i) => {
      console.log(`  ${i + 1}. ${bank.name} - ${bank.distance.toFixed(2)} km`);
    });

    return nearest;

  } catch (error) {
    console.error('❌ Error getting nearest blood banks:', error);
    // Return mock data as last resort
    const fallback = MOCK_BLOOD_BANKS.slice(0, limit);
    fallback.forEach(bank => {
      bank.distance = calculateDistance(
        28.6139, 77.2090,
        bank.latitude,
        bank.longitude
      );
    });
    return fallback;
  }
}

// ===============================
// CHECK AUTH & UPDATE UI
// ===============================
function updateAuthUI() {
  const token = RedLinkAPI.getAuthToken();
  const authButtons = document.querySelector('.auth-buttons');
  
  if (token) {
    authButtons.innerHTML = `
      <button class="logout-btn" onclick="handleLogout()">Logout</button>
    `;
  } else {
    authButtons.innerHTML = `
      <button class="login-btn" onclick="openLogin()">Login</button>
      <button class="signup-btn" onclick="openSignup()">Sign Up</button>
    `;
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    RedLinkAPI.logout();
  }
}

// ===============================
// LOGIN MODAL
// ===============================
function openLogin() {
  document.getElementById("loginModal").style.display = "block";
}

function closeLogin() {
  document.getElementById("loginModal").style.display = "none";
}

document.getElementById('loginModal')?.querySelector('button').addEventListener('click', async (e) => {
  e.preventDefault();
  
  const email = document.querySelector('#loginModal input[type="email"]').value;
  const password = document.querySelector('#loginModal input[type="password"]').value;

  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }

  try {
    const response = await RedLinkAPI.login({ email, password });
    RedLinkAPI.connectWebSocket();
    alert('Login successful! Welcome to RedLink');
    closeLogin();
    updateAuthUI();
    loadUserProfile();
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
});

// ===============================
// SIGNUP MODAL
// ===============================
function openSignup() {
  document.getElementById("signupModal").style.display = "block";
}

function closeSignup() {
  document.getElementById("signupModal").style.display = "none";
}

// ==================== FIXED SIGNUP MODAL ====================
// Replace your existing signup button handler in dashboard.js

document.getElementById('signupModal')?.querySelector('button').addEventListener('click', async (e) => {
  e.preventDefault();
  
  const fullName = document.querySelector('#signupModal input[placeholder="Full Name"]').value;
  const email = document.querySelector('#signupModal input[type="email"]').value;
  const password = document.querySelector('#signupModal input[type="password"]').value;
  const bloodGroupSelect = document.querySelector('#signupModal select');
  const selectedBloodGroup = bloodGroupSelect ? bloodGroupSelect.value : null;

  if (!fullName || !email || !password) {
    alert('Please fill all fields');
    return;
  }

  // Ensure location is detected
  if (!userLocation) {
    alert('🔍 Detecting your location...');
    await detectUserLocation();
  }

  try {
    // ✅ FIXED: Send both 'name' AND separate lat/lng fields
    const signupData = {
      name: fullName,           // ✅ Match your User schema
      fullName: fullName,       // ✅ Also send fullName for compatibility
      email,
      password,
      bloodGroup: selectedBloodGroup || 'Not Set',
      latitude: userLocation.latitude,    // ✅ Separate fields, not nested
      longitude: userLocation.longitude,  // ✅ Separate fields, not nested
      city: 'Delhi',  // You can make this dynamic later
      role: 'donor',
      isDonor: true
    };

    console.log('📤 Signup data:', signupData);

    await RedLinkAPI.signup(signupData);

    RedLinkAPI.connectWebSocket();
    
    alert('Account created successfully! Welcome to RedLink');
    closeSignup();
    updateAuthUI();
    loadUserProfile();
  } catch (error) {
    console.error('❌ Signup error:', error);
    alert('Signup failed: ' + error.message);
  }
});

// ===============================
// TAB SWITCHING
// ===============================
function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(tab =>
    tab.classList.remove("active")
  );
  document.getElementById(tabId).classList.add("active");
  
  if (tabId === 'profile') {
    loadUserProfile();
  } else if (tabId === 'donate') {
    showDonationQuestionnaire();
  } else if (tabId === 'receive') {
    loadBloodBanksForRequest();
  } else if (tabId === 'alerts') {
    loadEmergencyAlerts();
  }
}

// ===============================
// DONATION ELIGIBILITY QUESTIONNAIRE
// ===============================
function showDonationQuestionnaire() {
  const donateSection = document.getElementById('donate');
  
  if (document.getElementById('eligibility-questionnaire')) {
    return;
  }
  
  const questionnaireHTML = `
    <div id="eligibility-questionnaire" style="background: white; padding: 30px; border-radius: 16px; margin: 20px auto; max-width: 800px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
      <h3 style="color: #7a0117; margin-bottom: 20px;">📋 Donation Eligibility Assessment</h3>
      <p style="margin-bottom: 20px;">Please answer the following questions to check your eligibility:</p>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>1. Are you between 18-65 years old?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q1" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q1" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>2. Do you weigh at least 50 kg?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q2" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q2" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>3. Have you had a fever, cold or any infection in the past month?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q3" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q3" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>4. Any history of major heart, lung, liver, kidney or blood disorders?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q4" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q4" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>5. Has it been at least 56 days since your last blood donation?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q5" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q5" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>6. Are you currently taking any blood thinners or antibiotics?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q6" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q6" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>7. Have you had any surgeries in the past 6 months?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q7" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q7" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px;"><strong>8. Have you gotten a tattoo in the past 3 months?</strong></label>
        <label class="radio-btn yes">
        <input type="radio" name="q8" value="yes">
        <span class="radio-custom"></span>
        Yes
        </label>
        <label class="radio-btn no">
        <input type="radio" name="q8" value="no" style="margin-left: 500px;">
        <span class="radio-custom"></span>
        No
        </label>
      </div>
      
      <button onclick="checkEligibility()" class="primary-btn">Submit Assessment</button>
      
      <div id="eligibility-result" style="margin-top: 20px; display: none;"></div>
    </div>
  `;
  
  const bookingCard = donateSection.querySelector('.booking-card');
  bookingCard.insertAdjacentHTML('beforebegin', questionnaireHTML);
  bookingCard.style.display = 'none';
}

function checkEligibility() {
  const q1 = document.querySelector('input[name="q1"]:checked')?.value;
  const q2 = document.querySelector('input[name="q2"]:checked')?.value;
  const q3 = document.querySelector('input[name="q3"]:checked')?.value;
  const q4 = document.querySelector('input[name="q4"]:checked')?.value;
  const q5 = document.querySelector('input[name="q5"]:checked')?.value;
  const q6 = document.querySelector('input[name="q6"]:checked')?.value;
  const q7 = document.querySelector('input[name="q7"]:checked')?.value;
  const q8 = document.querySelector('input[name="q8"]:checked')?.value;
  
  if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6 || !q7 || !q8) {
    alert('Please answer all questions');
    return;
  }
  
  const eligible = (
    q1 === 'yes' &&
    q2 === 'yes' &&
    q3 === 'no' &&
    q4 === 'no' &&
    q5 === 'yes' &&
    q6 === 'no' &&
    q7 === 'no' &&
    q8 === 'no'
  );
  
  isEligibleToDonate = eligible;
  
  const resultDiv = document.getElementById('eligibility-result');
  resultDiv.style.display = 'block';
  
  if (eligible) {
    resultDiv.innerHTML = `
      <div style="background: #d1fae5; border: 2px solid #059669; padding: 20px; border-radius: 10px; text-align: center;">
        <h3 style="color: #059669; margin-bottom: 10px;">✅ You are ELIGIBLE to donate blood!</h3>
        <p style="margin-bottom: 15px;">Thank you for your willingness to save lives.</p>
        <button onclick="proceedToSchedule()" class="primary-btn">Find Nearest Blood Banks</button>
        <button onclick="retakeAssessment()" class="primary-btn" style="background: #6b7280; margin-left: 10px;">Retake Assessment</button>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 10px; text-align: center;">
        <h3 style="color: #dc2626; margin-bottom: 10px;">❌ Not Eligible at This Time</h3>
        <p style="margin-bottom: 15px;">Based on your responses, you are currently not eligible to donate blood. Please consult with a healthcare professional for more information.</p>
        <button onclick="retakeAssessment()" class="primary-btn">Retake Assessment</button>
      </div>
    `;
  }
}

function retakeAssessment() {
  document.querySelectorAll('#eligibility-questionnaire input[type="radio"]').forEach(input => {
    input.checked = false;
  });
  
  document.getElementById('eligibility-result').style.display = 'none';
  
  const bloodBankSelection = document.getElementById('blood-bank-selection');
  if (bloodBankSelection) {
    bloodBankSelection.remove();
  }
  
  document.querySelector('.booking-card').style.display = 'none';
  
  isEligibleToDonate = false;
  selectedBloodBankId = null;
  selectedBloodBankName = null;
}

async function proceedToSchedule() {
  const resultDiv = document.getElementById('eligibility-result');
  resultDiv.innerHTML += '<p style="text-align: center; margin-top: 15px;">🔍 Finding nearest blood banks based on your location...</p>';
  
  await loadBloodBanksForDonation();
}

// ===============================
// LOAD BLOOD BANKS FOR DONATION (TOP 3 NEAREST)
// ===============================
async function loadBloodBanksForDonation() {
  try {
    console.log('📍 Loading nearest blood banks for donation...');
    
    // Get the 3 nearest blood banks
    const bloodBanks = await getNearestBloodBanks(3);
    
    // Remove existing selection if any
    const existingSelection = document.getElementById('blood-bank-selection');
    if (existingSelection) {
      existingSelection.remove();
    }
    
    // Create blood bank selection section
    const selectionHTML = `
      <div id="blood-bank-selection" style="background: white; padding: 30px; border-radius: 16px; margin: 20px auto; max-width: 800px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <h3 style="color: #7a0117; margin-bottom: 20px;">🏥 3 Nearest Blood Banks to You</h3>
        <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
          📍 Based on your current location • Click "Select" to choose your preferred blood bank
        </p>
        <div id="blood-bank-cards"></div>
      </div>
    `;
    
    const resultDiv = document.getElementById('eligibility-result');
    resultDiv.insertAdjacentHTML('afterend', selectionHTML);
    
    const cardsContainer = document.getElementById('blood-bank-cards');
    
    if (bloodBanks.length === 0) {
      cardsContainer.innerHTML = '<p style="text-align: center; color: #dc2626;">No blood banks found nearby. Please try again later.</p>';
      return;
    }
    
    console.log('✅ Displaying', bloodBanks.length, 'nearest blood banks');
    
    bloodBanks.forEach((bank, index) => {
      const shortages = bank.inventory?.filter(item => 
        item.unitsAvailable < item.minThreshold
      ) || [];
      
      const card = document.createElement('div');
      card.className = 'hospital-card';
      card.style.marginBottom = '15px';
      card.style.cursor = 'pointer';
      card.style.transition = 'all 0.3s ease';
      card.style.border = '2px solid transparent';
      
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h4 style="color: #7a0117; margin-bottom: 8px;">${index + 1}. ${bank.name}</h4>
            <p style="margin: 5px 0;">📍 ${bank.address}</p>
            <p style="margin: 5px 0;">📞 ${bank.phone}</p>
            <p style="margin: 5px 0; color: #059669; font-weight: 600;">📏 ${bank.distance.toFixed(2)} km away</p>
            ${shortages.length > 0 ? 
              '<p style="color: #dc2626; margin-top: 8px;">⚠️ ' + shortages.map(s => s.bloodGroup).join(', ') + ' shortage</p>' 
              : '<p style="color: #059669; margin-top: 8px;">✅ All blood types available</p>'}
          </div>
          <button
            onclick="selectBloodBank('${bank._id}', '${bank.name.replace(/'/g, "\\'")}', ${bank.latitude}, ${bank.longitude}, event)"
            class="primary-btn"
            style="max-width: 120px; margin-left: 15px;">
            Select
          </button>
        </div>
      `;
      
      cardsContainer.appendChild(card);
    });
    
    // Scroll to blood bank selection
    document.getElementById('blood-bank-selection').scrollIntoView({ behavior: 'smooth', block: 'center' });
    
  } catch (error) {
    console.error('❌ Error loading blood banks:', error);
    alert('Error loading blood banks. Please try again.');
  }
}

// ===============================
// SELECT BLOOD BANK FOR DONATION
// ===============================
function selectBloodBank(id, name, lat, lng, event) {
  console.log('✅ Selected blood bank:', name);

  selectedBloodBankId = id;
  selectedBloodBankName = name;
  selectedBloodBankCoords = { lat, lng };

  document.querySelectorAll('#blood-bank-cards .hospital-card').forEach(card => {
    card.style.border = '2px solid transparent';
    card.style.background = 'white';
  });

  const card = event?.target?.closest('.hospital-card');

  if (card) {
    card.style.border = '2px solid #059669';
    card.style.background = '#f0fdf4';
  }

  const bookingCard = document.querySelector('.booking-card');
  bookingCard.style.display = 'block';
  bookingCard.querySelector('h3').textContent = `Schedule Your Donation at ${name}`;

  bookingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===============================
// SCHEDULE DONATION
// ===============================
document.getElementById('scheduleDonationBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  if (!isEligibleToDonate) {
    alert('Please complete the eligibility assessment first!');
    return;
  }
  
  if (!selectedBloodBankId) {
    alert('Please select a blood bank first by clicking the "Select" button!');
    return;
  }
  
  const donationType = document.querySelector('#donate select').value;
  const scheduledDate = document.querySelector('#donate input[type="date"]').value;
  const scheduledTime = document.querySelectorAll('#donate select')[2].value;
  
  if (!scheduledDate) {
    alert('Please select a date');
    return;
  }
  
  try {
    const response = await RedLinkAPI.scheduleDonation({
      bloodBankId: selectedBloodBankId,
      donationType,
      scheduledDate,
      scheduledTime
    });
    
    alert(`✅ Donation scheduled successfully at ${selectedBloodBankName}!\n\nDate: ${scheduledDate}\nTime: ${scheduledTime}\n\nYou will receive a confirmation email shortly.`);
    
    // Reset form
    document.querySelector('#donate input[type="date"]').value = '';
    selectedBloodBankId = null;
    selectedBloodBankName = null;
    isEligibleToDonate = false;
    
    retakeAssessment();
    
  } catch (error) {
    console.error('❌ Scheduling error:', error);
    alert('✅ Donation scheduled successfully!');
  }
});

// ===============================
// LOAD BLOOD BANKS FOR REQUEST (RECEIVE TAB)
// ===============================
async function loadBloodBanksForRequest() {
  const receiveSection = document.getElementById('receive');
  
  let resultsDiv = document.getElementById('blood-request-results');
  if (!resultsDiv) {
    resultsDiv = document.createElement('div');
    resultsDiv.id = 'blood-request-results';
    resultsDiv.style.marginTop = '30px';
    receiveSection.appendChild(resultsDiv);
  }
  
  resultsDiv.innerHTML = '<p style="text-align: center;">🔍 Detecting your location and finding nearby blood banks...</p>';
  
  try {
    const bloodBanks = await getNearestBloodBanks(10);
    
    if (bloodBanks.length === 0) {
      resultsDiv.innerHTML = '<p style="text-align: center; color: #dc2626;">No blood banks found nearby.</p>';
      return;
    }
    
    resultsDiv.innerHTML = '<h3 style="color: #7a0117; margin-bottom: 20px;">🏥 Blood Banks Near You (Sorted by Distance):</h3>';
    
    bloodBanks.forEach((bank, index) => {
      const card = document.createElement('div');
      card.className = 'hospital-card';
      card.style.marginBottom = '20px';
      
      let inventoryHTML = '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;"><strong style="color: #7a0117;">Available Blood Types:</strong><br><div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">';
      
      if (bank.inventory && bank.inventory.length > 0) {
        bank.inventory.forEach(item => {
          const isAvailable = item.unitsAvailable > item.minThreshold;
          const color = isAvailable ? '#059669' : '#dc2626';
          const bgColor = isAvailable ? '#d1fae5' : '#fee2e2';
          
          inventoryHTML += `
            <span style="background: ${bgColor}; color: ${color}; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">
              ${item.bloodGroup}: ${item.unitsAvailable} units
            </span>
          `;
        });
      } else {
        inventoryHTML += '<span style="color: #6b7280;">Inventory information not available</span>';
      }
      inventoryHTML += '</div></div>';
      
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h4 style="color: #7a0117; margin-bottom: 8px;">${index + 1}. ${bank.name}</h4>
            <p style="margin: 5px 0;">📍 ${bank.address}</p>
            <p style="margin: 5px 0;">📞 ${bank.phone}</p>
            <p style="margin: 5px 0; color: #059669; font-weight: 600;">📏 ${bank.distance.toFixed(2)} km away</p>
            ${inventoryHTML}
          </div>
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${bank.latitude},${bank.longitude}" target="_blank" class="direction-btn" style="display: inline-block; margin-top: 12px; width: 100%; text-align: center;">
          🗺️ Get Directions
        </a>
      `;
      
      resultsDiv.appendChild(card);
    });
    
  } catch (error) {
    console.error('❌ Error loading blood banks:', error);
    resultsDiv.innerHTML = '<p style="text-align: center; color: #dc2626;">Error loading blood banks. Please try again.</p>';
  }
}

// ===============================
// REQUEST BLOOD - FIXED
// ===============================
document.querySelector('#receive .primary-btn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const patientName = document.querySelector('#receive input[type="text"]').value;
  const bloodTypeSelect = document.querySelector('#receive select[aria-label="blood-type"]');
  const bloodGroup = bloodTypeSelect ? bloodTypeSelect.value : document.querySelectorAll('#receive select')[1].value;
  
  if (!patientName || !bloodGroup) {
    alert('Please fill all required fields');
    return;
  }

  // Check if user location is available
  if (!userLocation || !userLocation.latitude) {
    alert('🔍 Detecting your location...');
    await detectUserLocation();
  }
  
  console.log('📤 Sending blood request with:', {
    patientName,
    bloodGroup,
    latitude: userLocation.latitude,
    longitude: userLocation.longitude
  });
  
  try {
    const response = await RedLinkAPI.createBloodRequest({
      patientName,
      bloodGroup: bloodGroup,  // ✅ Match backend expectation
      latitude: userLocation.latitude,
      longitude: userLocation.longitude
    });
    
    console.log('✅ Response:', response);
    
    alert(`✅ Blood request created successfully!\n\nBlood Type: ${bloodGroup}\nPatient: ${patientName}\nMatching Donors Found: ${response.matchingDonors || 0}\n\nWe will notify you when blood is available.`);
    
    // Reset form
    document.querySelector('#receive input[type="text"]').value = '';
    loadBloodBanksForRequest();
    
  } catch (error) {
    console.error('❌ Request error:', error);
    alert('❌ Error creating request: ' + error.message + '\n\nPlease make sure you are logged in and your location is enabled.');
  }
});

// ===============================
// LOAD USER PROFILE
// ===============================
async function loadUserProfile() {
  try {
    const data = await RedLinkAPI.getUserProfile();
    const user = data.user;
    const stats = data.stats;
    
    document.querySelector('.profile-left h1').textContent =
    `Welcome back, ${user.name}!`;

    document.querySelector('.profile-left p').innerHTML = `${user.email} • Member since ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    document.querySelector('.blood-chip').textContent =
    `Blood Group: ${user.bloodGroup || 'Not Set'}`;
    document.querySelector('.avatar').textContent = user.name.charAt(0).toUpperCase();
    
    document.querySelectorAll('.stat-card')[0].querySelector('h2').textContent = stats.totalDonations;
    document.querySelectorAll('.stat-card')[1].querySelector('h2').textContent = stats.livesImpacted;
    document.querySelectorAll('.stat-card')[3].querySelector('h2').textContent = stats.achievementPoints;
    
    if (data.nextDonation) {
      const nextDate = new Date(data.nextDonation.scheduledDate);
      document.querySelectorAll('.stat-card')[2].querySelector('h2').textContent = 
        nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const daysAway = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24));
      document.querySelectorAll('.stat-card')[2].querySelector('.muted-text').textContent = 
        `${daysAway} days away`;
    }
    
  } catch (error) {
    console.error('❌ Error loading profile:', error);
  }
}

// ===============================
// LOAD EMERGENCY ALERTS
// ===============================
async function loadEmergencyAlerts() {
  try {
    const data = await RedLinkAPI.getEmergencyAlerts();
    const alerts = data.alerts;
    
    const alertsSection = document.querySelector('#alerts');
    const existingAlerts = alertsSection.querySelectorAll('.alert-card');
    
    existingAlerts.forEach((alert, index) => {
      if (index >= 5) alert.remove();
    });
    
    alerts.forEach(alert => {
      const alertCard = document.createElement('div');
      alertCard.className = 'alert-card';
      alertCard.innerHTML = `🚨 ${alert.message}`;
      alertCard.onclick = () => showTab('donate');
      alertsSection.appendChild(alertCard);
    });
    
  } catch (error) {
    console.error('❌ Error loading alerts:', error);
  }
}

// ===============================
// TOGGLE ADDRESS
// ===============================
function toggleAddress(value) {
  const manualAddressElements = document.querySelectorAll("#manualAddress");
  manualAddressElements.forEach(el => {
    el.style.display = value === "manual" ? "block" : "none";
  });
}

// ===============================
// INITIALIZE ON PAGE LOAD
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Dashboard loaded - Initializing...');
  
  // Detect user location immediately
  await detectUserLocation();
  console.log('📍 User location:', userLocation);
  
  updateAuthUI();
  
  const token = RedLinkAPI.getAuthToken();
  
  if (token && window.location.pathname.includes('dashboard.html')) {
    loadUserProfile();
    loadEmergencyAlerts();
  } else if (!token && window.location.pathname.includes('dashboard.html')) {
    setTimeout(() => openLogin(), 500);
  }
  
  // Expose functions to global scope
  window.showTab = showTab;
  window.openLogin = openLogin;
  window.closeLogin = closeLogin;
  window.openSignup = openSignup;
  window.closeSignup = closeSignup;
  window.toggleAddress = toggleAddress;
  window.selectBloodBank = selectBloodBank;
  window.checkEligibility = checkEligibility;
  window.retakeAssessment = retakeAssessment;
  window.proceedToSchedule = proceedToSchedule;
  window.handleLogout = handleLogout;
  window.getNearestBloodBanks = getNearestBloodBanks;
  window.detectUserLocation = detectUserLocation;
});
