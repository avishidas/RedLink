// enhanced-seed.js - Populate database with blood banks across India
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/redlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const bloodBankSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  phone: String,
  latitude: Number,
  longitude: Number,
  email: String,
  operatingHours: String,
  inventory: Array
});

const BloodBank = mongoose.model('BloodBank', bloodBankSchema);

// Helper function to generate random inventory
function generateInventory() {
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  return bloodTypes.map(type => ({
    bloodType: type,
    unitsAvailable: Math.floor(Math.random() * 50) + 10,
    minThreshold: type.includes('-') ? 10 : 20,
    lastUpdated: new Date()
  }));
}

const bloodBanksData = [
  // ========== DELHI (15 blood banks) ==========
  {
    name: "AIIMS Delhi Blood Bank",
    address: "Ansari Nagar, New Delhi",
    city: "Delhi",
    phone: "+91 11 2659 8500",
    latitude: 28.5672,
    longitude: 77.2300,
    email: "bloodbank@aiims.edu",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Red Cross Blood Bank",
    address: "1, Red Cross Road, Connaught Place",
    city: "Delhi",
    phone: "+91 11 2371 6441",
    latitude: 28.6328,
    longitude: 77.2197,
    email: "delhi@indianredcross.org",
    operatingHours: "9 AM - 5 PM",
    inventory: generateInventory()
  },
  {
    name: "Safdarjung Hospital Blood Bank",
    address: "Ring Road, Near AIIMS",
    city: "Delhi",
    phone: "+91 11 2673 0000",
    latitude: 28.5665,
    longitude: 77.2000,
    email: "bloodbank@safdarjung.nic.in",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Rotary Blood Bank",
    address: "Rajendra Place, Delhi",
    city: "Delhi",
    phone: "+91 11 2574 2014",
    latitude: 28.6410,
    longitude: 77.1813,
    email: "info@rotarybloodbank.org",
    operatingHours: "8 AM - 8 PM",
    inventory: generateInventory()
  },
  {
    name: "Apollo Hospital Blood Bank",
    address: "Mathura Road, Sarita Vihar",
    city: "Delhi",
    phone: "+91 11 2692 5858",
    latitude: 28.5355,
    longitude: 77.2860,
    email: "bloodbank@apollodelhi.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Max Hospital Blood Bank",
    address: "Press Enclave Road, Saket",
    city: "Delhi",
    phone: "+91 11 2651 5050",
    latitude: 28.5244,
    longitude: 77.2066,
    email: "bloodbank@maxhealthcare.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Fortis Hospital Blood Bank",
    address: "Aruna Asaf Ali Marg, Vasant Kunj",
    city: "Delhi",
    phone: "+91 11 4277 6222",
    latitude: 28.5083,
    longitude: 77.1556,
    email: "bloodbank@fortishealthcare.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Manipal Hospital Blood Bank",
    address: "Palam Vihar, Dwarka",
    city: "Delhi",
    phone: "+91 11 4967 4967",
    latitude: 28.5921,
    longitude: 77.0460,
    email: "bloodbank@manipalhospitals.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Sir Ganga Ram Hospital Blood Bank",
    address: "Rajinder Nagar, Delhi",
    city: "Delhi",
    phone: "+91 11 2575 0000",
    latitude: 28.6396,
    longitude: 77.1909,
    email: "bloodbank@sgrh.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "BLK Super Specialty Hospital Blood Bank",
    address: "Pusa Road, Rajendra Place",
    city: "Delhi",
    phone: "+91 11 3040 3040",
    latitude: 28.6415,
    longitude: 77.1835,
    email: "bloodbank@blkhospital.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Dharamshila Narayana Hospital Blood Bank",
    address: "Vasundhara Enclave, Delhi",
    city: "Delhi",
    phone: "+91 11 4344 4444",
    latitude: 28.6712,
    longitude: 77.3109,
    email: "bloodbank@dhrc.in",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Indraprastha Apollo Hospital Blood Bank",
    address: "Sarita Vihar, Delhi Mathura Road",
    city: "Delhi",
    phone: "+91 11 2692 5858",
    latitude: 28.5355,
    longitude: 77.2860,
    email: "bloodbank@apollohospitalsdelhi.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Primus Super Specialty Hospital Blood Bank",
    address: "Chanakyapuri, New Delhi",
    city: "Delhi",
    phone: "+91 11 4641 1111",
    latitude: 28.5979,
    longitude: 77.1803,
    email: "bloodbank@primushospital.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Batra Hospital Blood Bank",
    address: "Tughlakabad Institutional Area",
    city: "Delhi",
    phone: "+91 11 2986 5000",
    latitude: 28.5033,
    longitude: 77.2781,
    email: "bloodbank@batrahospital.com",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
  {
    name: "Rajiv Gandhi Super Specialty Hospital Blood Bank",
    address: "Tahirpur, Delhi",
    city: "Delhi",
    phone: "+91 11 2232 3232",
    latitude: 28.7041,
    longitude: 77.2497,
    email: "bloodbank@rgssh.org",
    operatingHours: "24/7",
    inventory: generateInventory()
  },
];

async function seedDatabase() {
  try {
    console.log('🔄 Starting database seeding...');
    
    // Clear existing data
    await BloodBank.deleteMany({});
    console.log('✅ Cleared existing blood banks');

    // Insert new data
    const result = await BloodBank.insertMany(bloodBanksData);
    console.log(`✅ Successfully seeded ${result.length} blood banks`);
    
    // Display summary
    const cities = [...new Set(bloodBanksData.map(bb => bb.city))];
    console.log('\n📊 Summary:');
    for (const city of cities) {
      const count = bloodBanksData.filter(bb => bb.city === city).length;
      console.log(`   ${city}: ${count} blood banks`);
    }
    console.log(`\n   Total: ${result.length} blood banks across ${cities.length} cities`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    mongoose.connection.close();
  }
}

seedDatabase();
