const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Bin = require('../models/Bin');
const PickupRequest = require('../models/PickupRequest');
const Report = require('../models/Report');
const RecyclingStats = require('../models/RecyclingStats');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'resident',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: { lat: 40.7128, lng: -74.0060 },
      },
      phone: '+1-555-0101',
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'resident',
      address: {
        street: '456 Park Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        coordinates: { lat: 40.7589, lng: -73.9851 },
      },
      phone: '+1-555-0102',
    },
    {
      name: 'Mike Johnson',
      email: 'mike@authority.com',
      password: 'password123',
      role: 'authority',
      address: {
        street: '789 City Hall',
        city: 'New York',
        state: 'NY',
        zipCode: '10003',
        coordinates: { lat: 40.7505, lng: -73.9934 },
      },
      phone: '+1-555-0201',
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah@authority.com',
      password: 'password123',
      role: 'authority',
      address: {
        street: '321 Admin Blvd',
        city: 'New York',
        state: 'NY',
        zipCode: '10004',
        coordinates: { lat: 40.7282, lng: -74.0776 },
      },
      phone: '+1-555-0202',
    },
  ];

  await User.deleteMany({});
  const createdUsers = await User.create(users);
  console.log('Users seeded successfully');
  return createdUsers;
};

const seedBins = async (users) => {
  const residents = users.filter(user => user.role === 'resident');
  
  const bins = [
    {
      binId: 'BIN001',
      type: 'general',
      location: {
        address: '123 Main St, New York, NY',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        zone: 'Zone A',
        route: 'Route 1',
      },
      status: 'half-full',
      capacity: { total: 100, current: 50 },
      assignedUsers: [residents[0]._id],
    },
    {
      binId: 'BIN002',
      type: 'recycling',
      location: {
        address: '456 Park Ave, New York, NY',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        zone: 'Zone A',
        route: 'Route 1',
      },
      status: 'overflowing',
      capacity: { total: 100, current: 105 },
      assignedUsers: [residents[1]._id],
      reportedIssues: ['Overflowing', 'Needs immediate attention'],
    },
    {
      binId: 'BIN003',
      type: 'organic',
      location: {
        address: '789 Broadway, New York, NY',
        coordinates: { lat: 40.7505, lng: -73.9934 },
        zone: 'Zone B',
        route: 'Route 2',
      },
      status: 'empty',
      capacity: { total: 100, current: 10 },
      assignedUsers: [residents[0]._id, residents[1]._id],
    },
    {
      binId: 'BIN004',
      type: 'general',
      location: {
        address: '321 5th Ave, New York, NY',
        coordinates: { lat: 40.7516, lng: -73.9755 },
        zone: 'Zone B',
        route: 'Route 2',
      },
      status: 'three-quarter-full',
      capacity: { total: 100, current: 80 },
      assignedUsers: [residents[1]._id],
    },
  ];

  await Bin.deleteMany({});
  const createdBins = await Bin.create(bins);
  console.log('Bins seeded successfully');
  return createdBins;
};

const seedPickupRequests = async (users, bins) => {
  const residents = users.filter(user => user.role === 'resident');
  
  const pickupRequests = [
    {
      user: residents[0]._id,
      bin: bins[0]._id,
      requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      preferredTimeSlot: { start: '09:00', end: '11:00' },
      priority: 'medium',
      status: 'pending',
      type: 'regular',
      notes: 'Regular scheduled pickup',
    },
    {
      user: residents[1]._id,
      bin: bins[1]._id,
      requestedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      preferredTimeSlot: { start: '08:00', end: '10:00' },
      priority: 'high',
      status: 'scheduled',
      type: 'emergency',
      notes: 'Urgent - bin overflowing',
      scheduledDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Tomorrow at 9 AM
    },
    {
      user: residents[0]._id,
      bin: bins[2]._id,
      requestedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      preferredTimeSlot: { start: '10:00', end: '12:00' },
      priority: 'low',
      status: 'completed',
      type: 'regular',
      completedDateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      actualWeight: 25.5,
      feedback: {
        rating: 5,
        comment: 'Excellent service, very punctual!',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    },
  ];

  await PickupRequest.deleteMany({});
  const createdRequests = await PickupRequest.create(pickupRequests);
  console.log('Pickup requests seeded successfully');
  return createdRequests;
};

const seedReports = async (users, bins) => {
  const residents = users.filter(user => user.role === 'resident');
  
  const reports = [
    {
      user: residents[1]._id,
      bin: bins[1]._id,
      type: 'overflow',
      severity: 'high',
      title: 'Recycling bin overflowing',
      description: 'The recycling bin at Park Ave is overflowing and attracting pests. Needs immediate attention.',
      location: {
        address: '456 Park Ave, New York, NY',
        coordinates: { lat: 40.7589, lng: -73.9851 },
      },
      status: 'open',
      priority: 'high',
    },
    {
      user: residents[0]._id,
      bin: bins[0]._id,
      type: 'damage',
      severity: 'medium',
      title: 'Bin lid damaged',
      description: 'The lid of the general waste bin is cracked and doesn\'t close properly.',
      location: {
        address: '123 Main St, New York, NY',
        coordinates: { lat: 40.7128, lng: -74.0060 },
      },
      status: 'resolved',
      priority: 'medium',
      resolution: {
        description: 'Bin lid has been replaced with a new one.',
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        actionsTaken: ['Replaced damaged lid', 'Inspected bin structure'],
      },
    },
    {
      user: residents[1]._id,
      type: 'other',
      severity: 'low',
      title: 'Request for additional bin',
      description: 'Our household generates more waste than our current bin can handle. We would like to request an additional bin.',
      location: {
        address: '456 Park Ave, New York, NY',
        coordinates: { lat: 40.7589, lng: -73.9851 },
      },
      status: 'acknowledged',
      priority: 'low',
    },
  ];

  await Report.deleteMany({});
  const createdReports = await Report.create(reports);
  console.log('Reports seeded successfully');
  return createdReports;
};

const seedRecyclingStats = async (users) => {
  const residents = users.filter(user => user.role === 'resident');
  
  const recyclingStats = [];
  
  // Generate stats for the last 6 months for each resident
  for (const user of residents) {
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // First day of the month
      
      const stats = {
        user: user._id,
        period: 'monthly',
        date,
        materials: {
          plastic: {
            weight: Math.random() * 15 + 5, // 5-20 kg
            items: Math.floor(Math.random() * 50 + 20), // 20-70 items
            co2Saved: Math.random() * 8 + 2, // 2-10 kg CO2
          },
          paper: {
            weight: Math.random() * 12 + 3, // 3-15 kg
            items: Math.floor(Math.random() * 40 + 15), // 15-55 items
            co2Saved: Math.random() * 6 + 1, // 1-7 kg CO2
          },
          glass: {
            weight: Math.random() * 8 + 2, // 2-10 kg
            items: Math.floor(Math.random() * 20 + 5), // 5-25 items
            co2Saved: Math.random() * 4 + 1, // 1-5 kg CO2
          },
          metal: {
            weight: Math.random() * 5 + 1, // 1-6 kg
            items: Math.floor(Math.random() * 15 + 5), // 5-20 items
            co2Saved: Math.random() * 3 + 0.5, // 0.5-3.5 kg CO2
          },
          organic: {
            weight: Math.random() * 20 + 10, // 10-30 kg
            items: Math.floor(Math.random() * 60 + 30), // 30-90 items
            co2Saved: Math.random() * 10 + 5, // 5-15 kg CO2
          },
        },
      };
      
      // Add some achievements for recent months
      if (i < 2) {
        stats.achievements = [];
        if (stats.materials.plastic.weight > 10) {
          stats.achievements.push({
            type: 'plastic_recycler',
            description: 'Recycled over 10kg of plastic this month',
          });
        }
        if (stats.totals?.co2Saved > 20) {
          stats.achievements.push({
            type: 'co2_saver',
            description: 'Saved over 20kg of CO₂ this month',
          });
        }
      }
      
      recyclingStats.push(stats);
    }
  }

  await RecyclingStats.deleteMany({});
  const createdStats = await RecyclingStats.create(recyclingStats);
  console.log('Recycling stats seeded successfully');
  return createdStats;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('Starting database seeding...');
    
    const users = await seedUsers();
    const bins = await seedBins(users);
    const pickupRequests = await seedPickupRequests(users, bins);
    const reports = await seedReports(users, bins);
    const recyclingStats = await seedRecyclingStats(users);
    
    console.log('Database seeding completed successfully!');
    console.log(`Created:
      - ${users.length} users
      - ${bins.length} bins
      - ${pickupRequests.length} pickup requests
      - ${reports.length} reports
      - ${recyclingStats.length} recycling stats records
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };