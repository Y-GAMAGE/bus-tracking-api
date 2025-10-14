const mongoose = require('mongoose');
const Route = require('../models/route');
const Bus = require('../models/Bus');
const Trip = require('../models/trip');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Route data based on your specifications
const routes = [
  {
    routeId: "CMB-GMP-019",
    name: "Colombo - Gampola Express Route 019",
    origin: { city: "Colombo", terminal: "Colombo Central Bus Stand" },
    destination: { city: "Gampola", terminal: "Gampola Bus Station" },
    distance: 116,
    estimatedDuration: 250, // 4hrs 10mins
    stops: [
      { name: "Colombo Central Bus Stand", sequence: 1, coordinates: { type: "Point", coordinates: [79.8612, 6.9271] }, estimatedArrivalOffset: 0 },
      { name: "Peliyagoda", sequence: 2, coordinates: { type: "Point", coordinates: [79.8889, 6.9583] }, estimatedArrivalOffset: 20 },
      { name: "Kelaniya", sequence: 3, coordinates: { type: "Point", coordinates: [79.9219, 6.9553] }, estimatedArrivalOffset: 30 },
      { name: "Kiribathgoda", sequence: 4, coordinates: { type: "Point", coordinates: [79.9300, 6.9800] }, estimatedArrivalOffset: 40 },
      { name: "Kadawatha", sequence: 5, coordinates: { type: "Point", coordinates: [79.9533, 7.0008] }, estimatedArrivalOffset: 50 },
      { name: "Belummahara / Miriswaththa", sequence: 6, coordinates: { type: "Point", coordinates: [79.9700, 7.0200] }, estimatedArrivalOffset: 60 },
      { name: "Yakkala", sequence: 7, coordinates: { type: "Point", coordinates: [80.0350, 7.0800] }, estimatedArrivalOffset: 75 },
      { name: "Nittambuwa", sequence: 8, coordinates: { type: "Point", coordinates: [80.0900, 7.1400] }, estimatedArrivalOffset: 90 },
      { name: "Warakapola", sequence: 9, coordinates: { type: "Point", coordinates: [80.2000, 7.2200] }, estimatedArrivalOffset: 110 },
      { name: "Kegalle", sequence: 10, coordinates: { type: "Point", coordinates: [80.3464, 7.2513] }, estimatedArrivalOffset: 130 },
      { name: "Mawanella", sequence: 11, coordinates: { type: "Point", coordinates: [80.4436, 7.2544] }, estimatedArrivalOffset: 150 },
      { name: "Kadugannawa", sequence: 12, coordinates: { type: "Point", coordinates: [80.5200, 7.2500] }, estimatedArrivalOffset: 170 },
      { name: "Pilimathalwa", sequence: 13, coordinates: { type: "Point", coordinates: [80.5500, 7.2600] }, estimatedArrivalOffset: 190 },
      { name: "Peradeniya", sequence: 14, coordinates: { type: "Point", coordinates: [80.5981, 7.2583] }, estimatedArrivalOffset: 210 },
      { name: "Gelioya", sequence: 15, coordinates: { type: "Point", coordinates: [80.6200, 7.2700] }, estimatedArrivalOffset: 230 },
      { name: "Gampola", sequence: 16, coordinates: { type: "Point", coordinates: [80.5653, 7.1619] }, estimatedArrivalOffset: 250 }
    ],
    fare: { normal: 200, express: 250, luxury: 350 }
  },
  {
    routeId: "KDY-KRT-602",
    name: "Kandy - Kurunegala Route 602",
    origin: { city: "Kandy", terminal: "Kandy Bus Station" },
    destination: { city: "Kurunegala", terminal: "Kurunegala Bus Stand" },
    distance: 43,
    estimatedDuration: 80, // 1hr 20mins
    stops: [
      { name: "Kandy", sequence: 1, coordinates: { type: "Point", coordinates: [80.6350, 7.2906] }, estimatedArrivalOffset: 0 },
      { name: "Katugasthota", sequence: 2, coordinates: { type: "Point", coordinates: [80.6500, 7.3100] }, estimatedArrivalOffset: 10 },
      { name: "Nugawela", sequence: 3, coordinates: { type: "Point", coordinates: [80.6700, 7.3300] }, estimatedArrivalOffset: 15 },
      { name: "Arambekade", sequence: 4, coordinates: { type: "Point", coordinates: [80.6900, 7.3500] }, estimatedArrivalOffset: 20 },
      { name: "Aladeniya", sequence: 5, coordinates: { type: "Point", coordinates: [80.7100, 7.3700] }, estimatedArrivalOffset: 25 },
      { name: "Galagedara", sequence: 6, coordinates: { type: "Point", coordinates: [80.7300, 7.3900] }, estimatedArrivalOffset: 30 },
      { name: "Wauda", sequence: 7, coordinates: { type: "Point", coordinates: [80.7500, 7.4100] }, estimatedArrivalOffset: 40 },
      { name: "Paragahadeniya", sequence: 8, coordinates: { type: "Point", coordinates: [80.7700, 7.4300] }, estimatedArrivalOffset: 50 },
      { name: "Mawathagama", sequence: 9, coordinates: { type: "Point", coordinates: [80.4500, 7.4500] }, estimatedArrivalOffset: 60 },
      { name: "Theliyagonna", sequence: 10, coordinates: { type: "Point", coordinates: [80.4200, 7.4700] }, estimatedArrivalOffset: 65 },
      { name: "Pilessa", sequence: 11, coordinates: { type: "Point", coordinates: [80.4000, 7.4800] }, estimatedArrivalOffset: 70 },
      { name: "Kurunegala", sequence: 12, coordinates: { type: "Point", coordinates: [80.3647, 7.4867] }, estimatedArrivalOffset: 80 }
    ],
    fare: { normal: 80, express: 100, luxury: 140 }
  },
  {
    routeId: "KLP-CMB-92",
    name: "Kuliyapitiya - Colombo Route 92",
    origin: { city: "Kuliyapitiya", terminal: "Kuliyapitiya Bus Stand" },
    destination: { city: "Colombo", terminal: "Colombo Bus Stand" },
    distance: 89,
    estimatedDuration: 170, // 2hrs 50mins
    stops: [
      { name: "Kuliyapitiya", sequence: 1, coordinates: { type: "Point", coordinates: [80.0400, 7.4700] }, estimatedArrivalOffset: 0 },
      { name: "Udubaddawa", sequence: 2, coordinates: { type: "Point", coordinates: [80.0200, 7.4500] }, estimatedArrivalOffset: 15 },
      { name: "Welipennagahamulla", sequence: 3, coordinates: { type: "Point", coordinates: [80.0000, 7.4300] }, estimatedArrivalOffset: 25 },
      { name: "Naththandiya", sequence: 4, coordinates: { type: "Point", coordinates: [79.9800, 7.4100] }, estimatedArrivalOffset: 35 },
      { name: "Kirimetiyana", sequence: 5, coordinates: { type: "Point", coordinates: [79.9600, 7.3900] }, estimatedArrivalOffset: 45 },
      { name: "Dankotuwa", sequence: 6, coordinates: { type: "Point", coordinates: [79.9400, 7.3200] }, estimatedArrivalOffset: 55 },
      { name: "Thoppuwa Junction", sequence: 7, coordinates: { type: "Point", coordinates: [79.9200, 7.2800] }, estimatedArrivalOffset: 65 },
      { name: "Kochchikade", sequence: 8, coordinates: { type: "Point", coordinates: [79.9000, 7.2400] }, estimatedArrivalOffset: 75 },
      { name: "Negombo", sequence: 9, coordinates: { type: "Point", coordinates: [79.8358, 7.2086] }, estimatedArrivalOffset: 85 },
      { name: "Seeduwa", sequence: 10, coordinates: { type: "Point", coordinates: [79.8800, 7.1200] }, estimatedArrivalOffset: 100 },
      { name: "Jaela", sequence: 11, coordinates: { type: "Point", coordinates: [79.8900, 7.0700] }, estimatedArrivalOffset: 110 },
      { name: "Kandana", sequence: 12, coordinates: { type: "Point", coordinates: [79.8950, 7.0400] }, estimatedArrivalOffset: 120 },
      { name: "Wattala", sequence: 13, coordinates: { type: "Point", coordinates: [79.8900, 6.9900] }, estimatedArrivalOffset: 135 },
      { name: "Peliyagoda", sequence: 14, coordinates: { type: "Point", coordinates: [79.8889, 6.9583] }, estimatedArrivalOffset: 150 },
      { name: "Thotalaga", sequence: 15, coordinates: { type: "Point", coordinates: [79.8700, 6.9400] }, estimatedArrivalOffset: 160 },
      { name: "Colombo", sequence: 16, coordinates: { type: "Point", coordinates: [79.8612, 6.9271] }, estimatedArrivalOffset: 170 }
    ],
    fare: { normal: 160, express: 200, luxury: 280 }
  },
  {
    routeId: "KRT-CMB-06",
    name: "Kurunegala - Colombo Route 06",
    origin: { city: "Kurunegala", terminal: "Kurunegala Bus Stand" },
    destination: { city: "Colombo", terminal: "Pettah Bus Stand" },
    distance: 98,
    estimatedDuration: 150, // 2hrs 30mins
    stops: [
      { name: "Kurunegala", sequence: 1, coordinates: { type: "Point", coordinates: [80.3647, 7.4867] }, estimatedArrivalOffset: 0 },
      { name: "Polgahawela", sequence: 2, coordinates: { type: "Point", coordinates: [80.2997, 7.3342] }, estimatedArrivalOffset: 20 },
      { name: "Alawwa", sequence: 3, coordinates: { type: "Point", coordinates: [80.2500, 7.2900] }, estimatedArrivalOffset: 35 },
      { name: "Warakapola", sequence: 4, coordinates: { type: "Point", coordinates: [80.2000, 7.2200] }, estimatedArrivalOffset: 50 },
      { name: "Nittambuwa", sequence: 5, coordinates: { type: "Point", coordinates: [80.0900, 7.1400] }, estimatedArrivalOffset: 70 },
      { name: "Yakkala", sequence: 6, coordinates: { type: "Point", coordinates: [80.0350, 7.0800] }, estimatedArrivalOffset: 85 },
      { name: "Kadawatha", sequence: 7, coordinates: { type: "Point", coordinates: [79.9533, 7.0008] }, estimatedArrivalOffset: 100 },
      { name: "Kiribathgoda", sequence: 8, coordinates: { type: "Point", coordinates: [79.9300, 6.9800] }, estimatedArrivalOffset: 115 },
      { name: "Colombo (Pettah)", sequence: 9, coordinates: { type: "Point", coordinates: [79.8553, 6.9344] }, estimatedArrivalOffset: 150 }
    ],
    fare: { normal: 140, express: 180, luxury: 250 }
  },
  {
    routeId: "CMB-MTR-02",
    name: "Colombo - Matara Route 02",
    origin: { city: "Colombo", terminal: "Pettah / Fort Bus Stand" },
    destination: { city: "Matara", terminal: "Matara Bus Station" },
    distance: 161,
    estimatedDuration: 285, // 4hrs 45mins
    stops: [
      { name: "Colombo (Pettah / Fort Bus Stand)", sequence: 1, coordinates: { type: "Point", coordinates: [79.8553, 6.9344] }, estimatedArrivalOffset: 0 },
      { name: "Colpetty / Kollupitiya", sequence: 2, coordinates: { type: "Point", coordinates: [79.8500, 6.9100] }, estimatedArrivalOffset: 15 },
      { name: "Dehiwala", sequence: 3, coordinates: { type: "Point", coordinates: [79.8633, 6.8569] }, estimatedArrivalOffset: 25 },
      { name: "Mount Lavinia", sequence: 4, coordinates: { type: "Point", coordinates: [79.8653, 6.8389] }, estimatedArrivalOffset: 35 },
      { name: "Panadura", sequence: 5, coordinates: { type: "Point", coordinates: [79.9075, 6.7133] }, estimatedArrivalOffset: 55 },
      { name: "Kalutara", sequence: 6, coordinates: { type: "Point", coordinates: [79.9608, 6.5853] }, estimatedArrivalOffset: 75 },
      { name: "Beruwala", sequence: 7, coordinates: { type: "Point", coordinates: [79.9828, 6.4789] }, estimatedArrivalOffset: 95 },
      { name: "Bentota", sequence: 8, coordinates: { type: "Point", coordinates: [80.0031, 6.4267] }, estimatedArrivalOffset: 110 },
      { name: "Aluthgama", sequence: 9, coordinates: { type: "Point", coordinates: [79.9997, 6.4319] }, estimatedArrivalOffset: 115 },
      { name: "Hikkaduwa", sequence: 10, coordinates: { type: "Point", coordinates: [80.1031, 6.1406] }, estimatedArrivalOffset: 150 },
      { name: "Galle", sequence: 11, coordinates: { type: "Point", coordinates: [80.2170, 6.0329] }, estimatedArrivalOffset: 180 },
      { name: "Unawatuna", sequence: 12, coordinates: { type: "Point", coordinates: [80.2500, 6.0100] }, estimatedArrivalOffset: 190 },
      { name: "Koggala", sequence: 13, coordinates: { type: "Point", coordinates: [80.3200, 5.9800] }, estimatedArrivalOffset: 210 },
      { name: "Ahangama", sequence: 14, coordinates: { type: "Point", coordinates: [80.3700, 5.9600] }, estimatedArrivalOffset: 230 },
      { name: "Weligama", sequence: 15, coordinates: { type: "Point", coordinates: [80.4297, 5.9756] }, estimatedArrivalOffset: 250 },
      { name: "Matara", sequence: 16, coordinates: { type: "Point", coordinates: [80.5550, 5.9549] }, estimatedArrivalOffset: 285 }
    ],
    fare: { normal: 240, express: 300, luxury: 420 }
  }
];

// Bus data - 25 buses (5 per route)
const buses = [
  // Route 019: Colombo - Gampola (5 buses)
  { registrationNumber: "WP-1001", type: "AC", capacity: 45, operator: { username: "gampola_express", phone: "+94711234567" }, permitNumber: "P019001", amenities: ["ac", "wifi", "charging-ports"], specifications: { manufacturer: "TATA", model: "Starbus", yearOfManufacture: 2020, fuelType: "diesel", color: "Blue" } },
  { registrationNumber: "WP-1002", type: "Private", capacity: 50, operator: { username: "central_line", phone: "+94711234568" }, permitNumber: "P019002", amenities: ["wifi", "charging-ports"], specifications: { manufacturer: "Ashok Leyland", model: "Viking", yearOfManufacture: 2019, fuelType: "diesel", color: "White" } },
  { registrationNumber: "WP-1003", type: "CTB", capacity: 55, operator: { username: "ctb_central", phone: "+94711234569" }, permitNumber: "P019003", amenities: ["gps"], specifications: { manufacturer: "TATA", model: "LP909", yearOfManufacture: 2018, fuelType: "diesel", color: "Red" } },
  { registrationNumber: "WP-1004", type: "AC", capacity: 42, operator: { username: "mountain_express", phone: "+94711234570" }, permitNumber: "P019004", amenities: ["ac", "reclining-seats", "entertainment"], specifications: { manufacturer: "Volvo", model: "B7RLE", yearOfManufacture: 2021, fuelType: "diesel", color: "Silver" } },
  { registrationNumber: "WP-1005", type: "Private", capacity: 48, operator: { username: "hill_country", phone: "+94711234571" }, permitNumber: "P019005", amenities: ["charging-ports", "wifi"], specifications: { manufacturer: "TATA", model: "Starbus", yearOfManufacture: 2020, fuelType: "diesel", color: "Green" } },

  // Route 602: Kandy - Kurunegala (5 buses)
  { registrationNumber: "CP-2001", type: "AC", capacity: 40, operator: { username: "kandy_kurunegala", phone: "+94712345678" }, permitNumber: "P602001", amenities: ["ac", "wifi"], specifications: { manufacturer: "Ashok Leyland", model: "Viking", yearOfManufacture: 2020, fuelType: "diesel", color: "Blue" } },
  { registrationNumber: "CP-2002", type: "Private", capacity: 45, operator: { username: "central_province", phone: "+94712345679" }, permitNumber: "P602002", amenities: ["charging-ports"], specifications: { manufacturer: "TATA", model: "LP1613", yearOfManufacture: 2019, fuelType: "diesel", color: "Yellow" } },
  { registrationNumber: "CP-2003", type: "CTB", capacity: 52, operator: { username: "ctb_central_602", phone: "+94712345680" }, permitNumber: "P602003", amenities: ["gps"], specifications: { manufacturer: "TATA", model: "LP909", yearOfManufacture: 2017, fuelType: "diesel", color: "Red" } },
  { registrationNumber: "CP-2004", type: "Private", capacity: 47, operator: { username: "northwest_line", phone: "+94712345681" }, permitNumber: "P602004", amenities: ["wifi", "charging-ports"], specifications: { manufacturer: "Ashok Leyland", model: "Stallion", yearOfManufacture: 2020, fuelType: "diesel", color: "White" } },
  { registrationNumber: "CP-2005", type: "AC", capacity: 44, operator: { username: "royal_express", phone: "+94712345682" }, permitNumber: "P602005", amenities: ["ac", "reclining-seats"], specifications: { manufacturer: "Volvo", model: "B9R", yearOfManufacture: 2021, fuelType: "diesel", color: "Maroon" } },

  // Route 92: Kuliyapitiya - Colombo (5 buses)
  { registrationNumber: "NW-3001", type: "Private", capacity: 49, operator: { username: "kuliyapitiya_express", phone: "+94713456789" }, permitNumber: "P092001", amenities: ["wifi", "charging-ports"], specifications: { manufacturer: "TATA", model: "Starbus", yearOfManufacture: 2020, fuelType: "diesel", color: "Orange" } },
  { registrationNumber: "NW-3002", type: "CTB", capacity: 54, operator: { username: "ctb_northwest", phone: "+94713456790" }, permitNumber: "P092002", amenities: ["gps"], specifications: { manufacturer: "TATA", model: "LP909", yearOfManufacture: 2018, fuelType: "diesel", color: "Red" } },
  { registrationNumber: "NW-3003", type: "AC", capacity: 43, operator: { username: "coastal_express", phone: "+94713456791" }, permitNumber: "P092003", amenities: ["ac", "wifi"], specifications: { manufacturer: "Ashok Leyland", model: "Viking", yearOfManufacture: 2021, fuelType: "diesel", color: "Teal" } },
  { registrationNumber: "NW-3004", type: "Private", capacity: 51, operator: { username: "negombo_line", phone: "+94713456792" }, permitNumber: "P092004", amenities: ["charging-ports"], specifications: { manufacturer: "TATA", model: "LP1613", yearOfManufacture: 2019, fuelType: "diesel", color: "Purple" } },
  { registrationNumber: "NW-3005", type: "AC", capacity: 46, operator: { username: "airport_express", phone: "+94713456793" }, permitNumber: "P092005", amenities: ["ac", "wifi", "entertainment"], specifications: { manufacturer: "Volvo", model: "B7RLE", yearOfManufacture: 2022, fuelType: "hybrid", color: "Navy" } },

  // Route 06: Kurunegala - Colombo (5 buses)
  { registrationNumber: "NW-4001", type: "AC", capacity: 44, operator: { username: "kurunegala_colombo", phone: "+94714567890" }, permitNumber: "P006001", amenities: ["ac", "charging-ports"], specifications: { manufacturer: "Ashok Leyland", model: "Viking", yearOfManufacture: 2020, fuelType: "diesel", color: "Blue" } },
  { registrationNumber: "NW-4002", type: "Private", capacity: 48, operator: { username: "wayamba_express", phone: "+94714567891" }, permitNumber: "P006002", amenities: ["wifi"], specifications: { manufacturer: "TATA", model: "Starbus", yearOfManufacture: 2019, fuelType: "diesel", color: "Gray" } },
  { registrationNumber: "NW-4003", type: "CTB", capacity: 53, operator: { username: "ctb_route_06", phone: "+94714567892" }, permitNumber: "P006003", amenities: ["gps"], specifications: { manufacturer: "TATA", model: "LP909", yearOfManufacture: 2017, fuelType: "diesel", color: "Red" } },
  { registrationNumber: "NW-4004", type: "Private", capacity: 50, operator: { username: "coconut_triangle", phone: "+94714567893" }, permitNumber: "P006004", amenities: ["charging-ports", "wifi"], specifications: { manufacturer: "Ashok Leyland", model: "Stallion", yearOfManufacture: 2020, fuelType: "diesel", color: "Brown" } },
  { registrationNumber: "NW-4005", type: "AC", capacity: 41, operator: { username: "premier_line", phone: "+94714567894" }, permitNumber: "P006005", amenities: ["ac", "reclining-seats", "entertainment"], specifications: { manufacturer: "Volvo", model: "B9R", yearOfManufacture: 2021, fuelType: "diesel", color: "Black" } },

  // Route 02: Colombo - Matara (5 buses)
  { registrationNumber: "SP-5001", type: "AC", capacity: 45, operator: { username: "southern_highway", phone: "+94715678901" }, permitNumber: "P002001", amenities: ["ac", "wifi", "entertainment"], specifications: { manufacturer: "Volvo", model: "B9R", yearOfManufacture: 2021, fuelType: "diesel", color: "Gold" } },
  { registrationNumber: "SP-5002", type: "Private", capacity: 52, operator: { username: "coastal_highway", phone: "+94715678902" }, permitNumber: "P002002", amenities: ["wifi", "charging-ports"], specifications: { manufacturer: "TATA", model: "Starbus", yearOfManufacture: 2020, fuelType: "diesel", color: "Turquoise" } },
  { registrationNumber: "SP-5003", type: "CTB", capacity: 56, operator: { username: "ctb_southern", phone: "+94715678903" }, permitNumber: "P002003", amenities: ["gps"], specifications: { manufacturer: "TATA", model: "LP909", yearOfManufacture: 2018, fuelType: "diesel", color: "Red" } },
  { registrationNumber: "SP-5004", type: "AC", capacity: 47, operator: { username: "expressway_line", phone: "+94715678904" }, permitNumber: "P002004", amenities: ["ac", "reclining-seats"], specifications: { manufacturer: "Ashok Leyland", model: "Viking", yearOfManufacture: 2020, fuelType: "diesel", color: "Emerald" } },
  { registrationNumber: "SP-5005", type: "Private", capacity: 49, operator: { username: "matara_express", phone: "+94715678905" }, permitNumber: "P002005", amenities: ["charging-ports", "wifi"], specifications: { manufacturer: "TATA", model: "LP1613", yearOfManufacture: 2019, fuelType: "diesel", color: "Crimson" } }
];

// Function to generate trips for the next 7 days
const generateTrips = (routes, buses) => {
  const trips = [];
  const today = new Date();
  
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    routes.forEach((route, routeIndex) => {
      // 3 trips per route per day (morning, afternoon, evening)
      const schedules = [
        { start: "06:00", prefix: "M" }, // Morning
        { start: "12:00", prefix: "A" }, // Afternoon  
        { start: "18:00", prefix: "E" }  // Evening
      ];
      
      schedules.forEach((schedule, scheduleIndex) => {
        const busIndex = (routeIndex * 5) + (scheduleIndex % 5); // Cycle through 5 buses per route
        const selectedBus = buses[busIndex];
        
        // Calculate end time based on route duration
        const [startHour, startMin] = schedule.start.split(':').map(Number);
        const durationMinutes = route.estimatedDuration;
        const endTotalMinutes = (startHour * 60) + startMin + durationMinutes;
        const endHour = Math.floor(endTotalMinutes / 60);
        const endMin = endTotalMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        
        // Create trip ID: ROUTE-YYYYMMDD-PREFIX-TIME
        const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = schedule.start.replace(':', '');
        const tripId = `${route.routeId}-${dateStr}-${schedule.prefix}-${timeStr}`;
        
        // Calculate start and end datetime
        const startDateTime = new Date(currentDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(currentDate);
        endDateTime.setHours(endHour, endMin, 0, 0);
        
        // Handle next day if end time goes past midnight
        if (endDateTime < startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }
        
        // Create stop arrivals
        const stopArrivals = route.stops.map(stop => {
          const arrivalDateTime = new Date(startDateTime);
          arrivalDateTime.setMinutes(arrivalDateTime.getMinutes() + stop.estimatedArrivalOffset);
          
          return {
            stopName: stop.name,
            estimatedArrival: arrivalDateTime,
            hasPassed: false,
            delayMinutes: 0
          };
        });
        
        trips.push({
          tripId,
          registrationNumber: selectedBus.registrationNumber,
          routeId: route.routeId,
          scheduledDate: currentDate,
          scheduledStartTime: startDateTime,
          scheduledEndTime: endDateTime,
          status: day === 0 && scheduleIndex === 0 ? 'in-progress' : 'scheduled',
          stopArrivals
        });
      });
    });
  }
  
  return trips;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🧹 Clearing existing data...');
    await Route.deleteMany({});
    await Bus.deleteMany({});
    await Trip.deleteMany({});
    
    console.log('🛣️  Seeding 5 routes...');
    const insertedRoutes = await Route.insertMany(routes);
    console.log(`✅ Created ${insertedRoutes.length} routes:`);
    insertedRoutes.forEach(route => {
      console.log(`   • ${route.routeId}: ${route.name} (${route.stops.length} stops)`);
    });
    
    console.log('\n🚌 Seeding 25 buses...');
    const insertedBuses = await Bus.insertMany(buses);
    console.log(`✅ Created ${insertedBuses.length} buses:`);
    
    // Group buses by type for summary
    const busTypes = insertedBuses.reduce((acc, bus) => {
      acc[bus.type] = (acc[bus.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(busTypes).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} buses`);
    });
    
    console.log('\n🗓️  Generating trips for next 7 days...');
    const trips = generateTrips(insertedRoutes, insertedBuses);
    
    const insertedTrips = await Trip.insertMany(trips);
    console.log(`✅ Created ${insertedTrips.length} trips:`);
    console.log(`   • ${insertedTrips.length / 7} trips per day`);
    console.log(`   • 3 trips per route per day (Morning, Afternoon, Evening)`);
    console.log(`   • 5 routes × 3 schedules = 15 trips per day`);
    
    console.log('\n🎯 Summary:');
    console.log(`   📍 Routes: ${insertedRoutes.length}`);
    console.log(`   🚌 Buses: ${insertedBuses.length}`);
    console.log(`   🚍 Trips: ${insertedTrips.length} (7 days)`);
    console.log('   ⚡ Ready for GPS simulation!');
    
    console.log('\n📋 Available Routes:');
    console.log('   1. CMB-GMP-019: Colombo - Gampola (116km, 4h 10m)');
    console.log('   2. KDY-KRT-602: Kandy - Kurunegala (43km, 1h 20m)');
    console.log('   3. KLP-CMB-92: Kuliyapitiya - Colombo (89km, 2h 50m)');
    console.log('   4. KRT-CMB-06: Kurunegala - Colombo (98km, 2h 30m)');
    console.log('   5. CMB-MTR-02: Colombo - Matara (161km, 4h 45m)');
    
    console.log('\n🚀 Test Commands:');
    console.log('   GET /api/trips/scheduled?busType=AC');
    console.log('   GET /api/trips/scheduled?routeId=CMB-GMP-019');
    console.log('   POST /api/trips/{tripId}/simulate-gps');
    console.log('   GET /api/locations/bus/{registrationNumber}/current\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, routes, buses };