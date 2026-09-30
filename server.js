// server.js - Fixed and Integrated Backend
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../redLink-frontend')));

// Default route (landing page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../redLink-frontend/index.html'));
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/redlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));


const JWT_SECRET = 'myredlinkblooddonation-project-2026-hackathon-brainwave';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// ==================== SCHEMAS ====================

// User Schema - Fixed and Unified
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: { type: String },  // Support both
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bloodGroup: String,
  phone: String,
  address: String,
  city: String,
  latitude: Number,
  longitude: Number,
  role: { type: String, enum: ["donor", "hospital", "admin"], default: "donor" },
  isDonor: { type: Boolean, default: true },
  lastDonation: Date,
  totalDonations: { type: Number, default: 0 },
  achievementPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Virtual field to support both 'name' and 'fullName'
userSchema.virtual('displayName').get(function() {
  return this.fullName || this.name;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const bloodBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  email: String,
  operatingHours: String,
  inventory: [{
    bloodType: String,  // Changed from bloodGroup for consistency
    unitsAvailable: { type: Number, default: 0 },
    minThreshold: { type: Number, default: 10 },
    lastUpdated: { type: Date, default: Date.now }
  }]
});

const donationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  donationType: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: String,
  status: { type: String, default: 'scheduled' },
  address: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const bloodRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Optional
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsNeeded: { type: Number, default: 1 },
  urgency: { type: String, default: 'normal' },
  location: String,
  city: String,
  latitude: Number,
  longitude: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  fulfilledAt: Date,
  notes: String
});

const emergencyAlertSchema = new mongoose.Schema({
  bloodGroup: { type: String, required: true },
  location: { type: String, required: true },
  bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
  message: { type: String, required: true },
  severity: { type: String, default: 'high' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const BloodBank = mongoose.model('BloodBank', bloodBankSchema);
const Donation = mongoose.model('Donation', donationSchema);
const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

// ==================== MIDDLEWARE ====================

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================

// Signup - Fixed
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('📝 Signup request received:', req.body);
    
    const { name, fullName, email, password, bloodGroup, phone, city, latitude, longitude } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name || fullName || 'User',
      fullName: fullName || name || 'User',
      email,
      password: hashedPassword,
      bloodGroup: bloodGroup || 'O+',
      phone,
      city: city || 'Delhi',
      latitude,
      longitude,
      role: 'donor',
      isDonor: true
    });

    await user.save();
    console.log('✅ New user created:', { 
      id: user._id,
      name: user.name, 
      bloodGroup: user.bloodGroup, 
      location: { latitude, longitude } 
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        bloodGroup: user.bloodGroup
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ error: 'Error creating user', details: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        bloodGroup: user.bloodGroup,
        isDonor: user.isDonor
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Error during login', details: error.message });
  }
});

// ==================== USER ROUTES ====================

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    const donations = await Donation.find({ userId: user._id })
      .populate('bloodBankId')
      .sort({ createdAt: -1 });

    const nextDonation = await Donation.findOne({ 
      userId: user._id, 
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    }).sort({ scheduledDate: 1 });

    res.json({
      user,
      donations,
      nextDonation,
      stats: {
        totalDonations: user.totalDonations,
        livesImpacted: user.totalDonations * 3,
        achievementPoints: user.achievementPoints
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile', details: error.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, name, phone, address, city, bloodGroup, latitude, longitude } = req.body;

    const updateData = {};
    if (fullName || name) {
      updateData.name = name || fullName;
      updateData.fullName = fullName || name;
    }
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (bloodGroup) updateData.bloodGroup = bloodGroup;
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile', details: error.message });
  }
});

// ==================== BLOOD BANK ROUTES ====================

app.get('/api/bloodbanks', async (req, res) => {
  try {
    const { city, latitude, longitude, radius = 50 } = req.query;

    let query = {};
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    let bloodBanks = await BloodBank.find(query);

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      
      bloodBanks = bloodBanks.map(bank => {
        const distance = calculateDistance(lat, lon, bank.latitude, bank.longitude);
        return { ...bank.toObject(), distance };
      }).filter(bank => bank.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    }

    res.json({ bloodBanks });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blood banks', details: error.message });
  }
});

app.get('/api/bloodbanks/:id', async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }
    res.json({ bloodBank });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blood bank', details: error.message });
  }
});

app.get('/api/bloodbanks/:id/inventory', async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }

    const shortages = bloodBank.inventory.filter(item => 
      item.unitsAvailable < item.minThreshold
    );

    res.json({ 
      inventory: bloodBank.inventory,
      shortages,
      hasShortage: shortages.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory', details: error.message });
  }
});

app.post('/api/bloodbanks', async (req, res) => {
  try {
    const bloodBank = new BloodBank(req.body);
    await bloodBank.save();
    res.status(201).json({ message: 'Blood bank created', bloodBank });
  } catch (error) {
    res.status(500).json({ error: 'Error creating blood bank', details: error.message });
  }
});

app.put('/api/bloodbanks/:id/inventory', async (req, res) => {
  try {
    const { bloodType, unitsAvailable } = req.body;

    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }

    const inventoryItem = bloodBank.inventory.find(item => item.bloodType === bloodType);
    
    if (inventoryItem) {
      inventoryItem.unitsAvailable = unitsAvailable;
      inventoryItem.lastUpdated = new Date();
    } else {
      bloodBank.inventory.push({
        bloodType,
        unitsAvailable,
        lastUpdated: new Date()
      });
    }

    await bloodBank.save();

    // Check for shortage and create alert
    if (inventoryItem && unitsAvailable < inventoryItem.minThreshold) {
      const alert = new EmergencyAlert({
        bloodGroup: bloodType,
        location: bloodBank.address,
        bloodBankId: bloodBank._id,
        message: `${bloodType} blood shortage at ${bloodBank.name}`,
        severity: unitsAvailable === 0 ? 'critical' : 'high'
      });
      await alert.save();
      io.emit('emergency-alert', alert);
    }

    res.json({ message: 'Inventory updated', bloodBank });
  } catch (error) {
    res.status(500).json({ error: 'Error updating inventory', details: error.message });
  }
});

// ==================== DONATION ROUTES ====================

app.post('/api/donations', authenticateToken, async (req, res) => {
  try {
    const { bloodBankId, donationType, scheduledDate, scheduledTime, address } = req.body;

    const donation = new Donation({
      userId: req.user.userId,
      bloodBankId,
      donationType,
      scheduledDate,
      scheduledTime,
      address,
      status: 'scheduled'
    });

    await donation.save();

    res.status(201).json({ 
      message: 'Donation scheduled successfully', 
      donation 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error scheduling donation', details: error.message });
  }
});

app.get('/api/donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user.userId })
      .populate('bloodBankId')
      .sort({ createdAt: -1 });

    res.json({ donations });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching donations', details: error.message });
  }
});

app.put('/api/donations/:id/complete', authenticateToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    donation.status = 'completed';
    donation.completedAt = new Date();
    await donation.save();

    // Update user stats
    const user = await User.findById(donation.userId);
    user.totalDonations += 1;
    user.achievementPoints += 100;
    user.lastDonation = new Date();
    await user.save();

    res.json({ message: 'Donation marked as completed', donation });
  } catch (error) {
    res.status(500).json({ error: 'Error completing donation', details: error.message });
  }
});

// ==================== BLOOD REQUEST ROUTES - FIXED ====================

// Replace the existing POST /api/requests handler with this version.

app.post('/api/requests', async (req, res) => {
  try {
    console.log('📥 Received blood request:', req.body);
    
    const {
      patientName,
      bloodGroup,
      unitsNeeded,
      urgency,
      location,
      city,
      latitude,
      longitude,
      notes
    } = req.body;

    // Validate required fields
    if (!patientName || !bloodGroup) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['patientName', 'bloodGroup'],
        received: req.body
      });
    }

    // Parse and validate numeric coordinates
    const reqLat = parseFloat(latitude);
    const reqLon = parseFloat(longitude);
    if (isNaN(reqLat) || isNaN(reqLon)) {
      return res.status(400).json({
        error: 'Location is required and must be valid numbers',
        message: 'Please enable location services and send numeric latitude and longitude'
      });
    }

    // Optional authentication (unchanged)
    let userId = null;
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
      try {
        const verified = jwt.verify(token, JWT_SECRET);
        userId = verified.userId;
      } catch (error) {
        console.log('⚠️ Request made without valid token');
      }
    }

    const bloodRequest = new BloodRequest({
      userId,
      patientName,
      bloodGroup,
      unitsNeeded: unitsNeeded || 1,
      urgency: urgency || 'normal',
      location: location || 'Not specified',
      city: city || 'Delhi',
      latitude: reqLat,
      longitude: reqLon,
      notes,
      status: 'pending'
    });

    await bloodRequest.save();
    console.log('✅ Blood request saved:', bloodRequest._id);

    // Blood compatibility map (unchanged)
    const compatibilityMap = {
      "O-": ["O-"],
      "O+": ["O+", "O-"],
      "A-": ["A-", "O-"],
      "A+": ["A+", "A-", "O+", "O-"],
      "B-": ["B-", "O-"],
      "B+": ["B+", "B-", "O+", "O-"],
      "AB-": ["AB-", "A-", "B-", "O-"],
      "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    };
    
    const compatibleGroups = compatibilityMap[bloodGroup] || [bloodGroup];
    console.log(`🔍 Looking for donors with blood groups: ${compatibleGroups.join(', ')}`);
    
    // 56-day donation eligibility
    const eligibleDate = new Date();
    eligibleDate.setDate(eligibleDate.getDate() - 56);

    // Build query correctly using $and so multiple $or conditions don't overwrite each other
    const matchingDonors = await User.find({
      $and: [
        { bloodGroup: { $in: compatibleGroups } },
        { $or: [{ role: 'donor' }, { role: { $exists: false } }] },
        { $or: [
            { lastDonation: { $lte: eligibleDate } },
            { lastDonation: { $exists: false } },
            { lastDonation: null }
          ]
        }
      ]
    }).select('name fullName email phone bloodGroup latitude longitude city');

    console.log(`✅ Found ${matchingDonors.length} potential donors in database`);
    
    // Filter by distance (50km radius). Use `!= null` to catch 0 values.
    const nearbyDonors = matchingDonors
      .filter(donor => donor.latitude != null && donor.longitude != null)
      .map(donor => ({
        ...donor.toObject(),
        distance: calculateDistance(
          reqLat,
          reqLon,
          parseFloat(donor.latitude),
          parseFloat(donor.longitude)
        )
      }))
      .filter(donor => donor.distance <= 50)
      .sort((a, b) => a.distance - b.distance);

    console.log(`✅ Found ${nearbyDonors.length} donors within 50km`);

    // Create emergency alert if urgent
    if (urgency === 'emergency') {
      const alert = new EmergencyAlert({
        bloodGroup,
        location: location || city || 'Unknown',
        message: `URGENT: ${bloodGroup} blood needed for ${patientName}`,
        severity: 'critical'
      });
      await alert.save();
      io.emit('emergency-alert', alert);
    }

    res.status(201).json({ 
      success: true,
      message: 'Blood request created successfully', 
      bloodRequest,
      matchingDonors: nearbyDonors.length,
      donors: nearbyDonors.slice(0, 10)
    });
  } catch (error) {
    console.error('❌ Error creating blood request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error creating request', 
      details: error.message 
    });
  }
});
// ==================== EMERGENCY ALERT ROUTES ====================

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ isActive: true })
      .populate('bloodBankId')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching alerts', details: error.message });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const alert = new EmergencyAlert(req.body);
    await alert.save();
    io.emit('emergency-alert', alert);
    res.status(201).json({ message: 'Alert created', alert });
  } catch (error) {
    res.status(500).json({ error: 'Error creating alert', details: error.message });
  }
});

app.put('/api/alerts/:id/deactivate', async (req, res) => {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: 'Alert deactivated', alert });
  } catch (error) {
    res.status(500).json({ error: 'Error deactivating alert', details: error.message });
  }
});

// ==================== AI PREDICTION ROUTE ====================

app.get('/api/predictions/shortages', async (req, res) => {
  try {
    const bloodBanks = await BloodBank.find();
    const predictions = [];

    for (const bank of bloodBanks) {
      for (const item of bank.inventory) {
        if (item.unitsAvailable < item.minThreshold * 1.5) {
          const daysUntilShortage = Math.floor(item.unitsAvailable / 2);
          
          predictions.push({
            bloodBank: bank.name,
            bloodGroup: item.bloodType,
            currentUnits: item.unitsAvailable,
            threshold: item.minThreshold,
            predictedShortageDate: new Date(Date.now() + daysUntilShortage * 24 * 60 * 60 * 1000),
            severity: item.unitsAvailable < item.minThreshold ? 'critical' : 'warning'
          });
        }
      }
    }

    predictions.sort((a, b) => a.currentUnits - b.currentUnits);
    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: 'Error generating predictions', details: error.message });
  }
});
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🤖 Chatbot request:', message);

    // Initialize Gemini model (FREE!)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build system context
    const systemPrompt = `You are RedLink AI Assistant, a helpful chatbot for a blood donation platform called RedLink.

RedLink helps users:
- Find nearby blood banks in Delhi
- Schedule blood donations
- Check blood availability in real-time
- Request blood in emergencies
- Get AI-powered shortage predictions

Blood donation eligibility criteria:
- Age: 18-65 years
- Weight: At least 50 kg
- No fever/cold/infection in past month
- No major heart, lung, liver, kidney, or blood disorders
- At least 56 days since last donation
- Not taking blood thinners or antibiotics
- No surgeries in past 6 months
- No tattoos in past 3 months

Available blood banks in Delhi:
1. AIIMS Delhi - Ansari Nagar, New Delhi - Phone: +91 11 2659 8500
2. Red Cross Blood Bank - Connaught Place, Delhi - Phone: +91 11 2371 6441
3. Safdarjung Hospital - Ring Road, Near AIIMS - Phone: +91 11 2673 0000
4. Rotary Blood Bank - Rajendra Place, Delhi - Phone: +91 11 2574 2014
5. Apollo Hospital - Mathura Road, Sarita Vihar - Phone: +91 11 2692 5858

Blood type compatibility:
- O- is universal donor (can give to all)
- AB+ is universal recipient (can receive from all)
- A+ can donate to A+, AB+
- B+ can donate to B+, AB+
- O+ can donate to O+, A+, B+, AB+

Be helpful, friendly, and concise. Format important information with bullet points. If asked about specific medical advice, remind users to consult healthcare professionals.`;

    // Build conversation history for Gemini
    const chatHistory = [];
    
    // Add system prompt as first message
    chatHistory.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    chatHistory.push({
      role: 'model',
      parts: [{ text: 'Understood. I am RedLink AI Assistant, ready to help users with blood donation queries.' }]
    });

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach(msg => {
        chatHistory.push({
          role: msg.role,
          parts: msg.parts
        });
      });
    }

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    console.log('✅ Chatbot response generated');

    res.json({
      reply: reply,
      success: true
    });

  } catch (error) {
    console.error('❌ Chatbot API Error:', error);
    
    // Return fallback response if API fails
    res.json({
      reply: `I apologize, but I'm having trouble processing your request right now. 

Here are some quick links that might help:
• Check eligibility in the **"Donate Blood"** tab
• Find blood banks in the **"Donate Blood"** or **"Receive Blood"** tabs
• View emergency alerts in the **"Emergency"** tab

For urgent assistance, please contact our support team or call:
• AIIMS Delhi: +91 11 2659 8500
• Red Cross: +91 11 2371 6441`,
      success: false,
      error: error.message
    });
  }
});
// ==================== UTILITY FUNCTIONS ====================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'RedLink API is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🩸 RedLink Backend running on port ${PORT}`);
  console.log(`📍 API available at: http://localhost:${PORT}/api`);
  console.log(`✅ Server is ready to accept requests`);
});
