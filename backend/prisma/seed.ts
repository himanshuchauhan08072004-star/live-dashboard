import { db, initSchema } from "../src/db";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

initSchema();

// Clear existing data (idempotent re-seed)
db.exec(`
  DELETE FROM Notification;
  DELETE FROM BookingStatusHistory;
  DELETE FROM Booking;
  DELETE FROM Service;
  DELETE FROM ServiceCategory;
  DELETE FROM Vehicle;
  DELETE FROM Mechanic;
  DELETE FROM Customer;
  DELETE FROM User;
`);

const id = () => nanoid(12);

// ---- Users ----
const insUser = db.prepare(
  `INSERT INTO User (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)`
);
const hash = bcrypt.hashSync("password123", 10);
insUser.run(id(), "Anita Rao", "admin@vsod.in", hash, "ADMIN");
insUser.run(id(), "Karan Mehta", "ops@vsod.in", hash, "OPERATIONS");

// ---- Service Categories & Services ----
const categories = [
  "General Service",
  "Oil Change",
  "Brake Service",
  "AC Service",
  "Battery",
  "Tyres",
  "Engine Diagnostics",
  "Car Wash",
];
const insCat = db.prepare(`INSERT INTO ServiceCategory (id, name) VALUES (?, ?)`);
const catIds: Record<string, string> = {};
for (const c of categories) {
  const cid = id();
  catIds[c] = cid;
  insCat.run(cid, c);
}

const servicesByCat: Record<string, [string, number][]> = {
  "General Service": [["Full General Service", 2499], ["Basic Checkup", 899]],
  "Oil Change": [["Synthetic Oil Change", 1799], ["Mineral Oil Change", 999]],
  "Brake Service": [["Brake Pad Replacement", 2199], ["Brake Fluid Change", 799]],
  "AC Service": [["AC Gas Refill", 1899], ["AC Full Service", 2499]],
  Battery: [["Battery Replacement", 4999], ["Battery Jumpstart", 499]],
  Tyres: [["Tyre Replacement (set of 4)", 12999], ["Wheel Alignment & Balancing", 999]],
  "Engine Diagnostics": [["Computerized Diagnostics", 1299], ["Engine Tune-up", 2999]],
  "Car Wash": [["Premium Car Wash", 499], ["Interior Detailing", 1499]],
};
const insSvc = db.prepare(
  `INSERT INTO Service (id, name, categoryId, basePrice) VALUES (?, ?, ?, ?)`
);
const serviceIds: string[] = [];
for (const [cat, svcs] of Object.entries(servicesByCat)) {
  for (const [name, price] of svcs) {
    const sid = id();
    insSvc.run(sid, name, catIds[cat], price);
    serviceIds.push(sid);
  }
}

// ---- Mechanics ----
const mechanicFirst = ["Rajesh", "Arjun", "Vikram", "Suresh", "Anil", "Manoj", "Deepak", "Sanjay", "Ravi", "Ajay", "Naveen", "Praveen", "Rahul", "Vivek", "Amit", "Sunil", "Ashok", "Ramesh", "Gopal", "Mahesh", "Kiran", "Yogesh", "Harish", "Nitin"];
const mechanicLast = ["Kumar", "Sharma", "Yadav", "Verma", "Singh", "Gupta", "Chauhan", "Rathore", "Mishra", "Tiwari", "Pandey", "Reddy"];
const mechStatuses = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "ASSIGNED", "ON_THE_WAY", "BUSY", "OFFLINE"];
const insMech = db.prepare(
  `INSERT INTO Mechanic (id, name, phone, status, rating, latitude, longitude, jobsCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const mechanicIds: string[] = [];
// Gurugram-area coordinate spread
const baseLat = 28.4595, baseLng = 77.0266;
for (let i = 0; i < 24; i++) {
  const mid = id();
  mechanicIds.push(mid);
  const name = `${mechanicFirst[i % mechanicFirst.length]} ${mechanicLast[(i * 3) % mechanicLast.length]}`;
  const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
  const status = mechStatuses[i % mechStatuses.length];
  const rating = Math.round((3.8 + Math.random() * 1.2) * 10) / 10;
  const lat = baseLat + (Math.random() - 0.5) * 0.15;
  const lng = baseLng + (Math.random() - 0.5) * 0.15;
  const jobs = Math.floor(Math.random() * 180) + 5;
  insMech.run(mid, name, phone, status, rating, lat, lng, jobs);
}

// ---- Customers & Vehicles ----
const custFirst = ["Priya", "Rohan", "Neha", "Aditya", "Simran", "Karan", "Pooja", "Rahul", "Sneha", "Vikas", "Anjali", "Gaurav", "Divya", "Sandeep", "Ritu", "Manish", "Kavya", "Nikhil", "Shreya", "Tarun", "Meera", "Abhishek", "Isha", "Rohit", "Swati", "Varun", "Preeti", "Siddharth", "Nidhi", "Akash", "Bhavna", "Rajat", "Komal", "Yash", "Sakshi", "Dev", "Tanvi", "Aryan", "Riya", "Kunal", "Pallavi", "Harsh", "Simmi", "Mohit", "Neetu", "Vishal", "Alka", "Sameer", "Payal", "Ankit"];
const custLast = ["Sharma", "Kapoor", "Malhotra", "Chaudhary", "Singh", "Bansal", "Aggarwal", "Joshi", "Nair", "Iyer", "Kaur", "Chopra", "Bhatia", "Saxena", "Mehra", "Grover", "Sethi", "Arora", "Batra", "Khanna"];
const carMakes: [string, string[]][] = [
  ["Maruti Suzuki", ["Swift", "Baleno", "Wagon R", "Dzire", "Ertiga"]],
  ["Hyundai", ["i20", "Creta", "Venue", "Verna"]],
  ["Tata", ["Nexon", "Punch", "Altroz", "Harrier"]],
  ["Honda", ["City", "Amaze", "WR-V"]],
  ["Toyota", ["Innova Crysta", "Glanza", "Urban Cruiser"]],
  ["Mahindra", ["XUV700", "Scorpio", "Bolero"]],
  ["Kia", ["Seltos", "Sonet"]],
];
const stateCodes = ["HR26", "DL8C", "UP16", "HR29", "DL1C", "HR51"];
const areas = ["Sector 14, Gurugram", "DLF Phase 3, Gurugram", "Sohna Road, Gurugram", "Sector 56, Gurugram", "Yamuna Nagar", "Karnal", "Panipat", "Rohtak", "Sector 29, Gurugram", "MG Road, Gurugram"];

const insCust = db.prepare(
  `INSERT INTO Customer (id, name, email, phone, address, customerSince) VALUES (?, ?, ?, ?, ?, ?)`
);
const insVeh = db.prepare(
  `INSERT INTO Vehicle (id, customerId, make, model, regNumber) VALUES (?, ?, ?, ?, ?)`
);

function randomPastDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

const customerIds: string[] = [];
const vehiclesByCustomer: Record<string, string[]> = {};
for (let i = 0; i < 60; i++) {
  const cid = id();
  customerIds.push(cid);
  const fn = custFirst[i % custFirst.length];
  const ln = custLast[(i * 7) % custLast.length];
  const name = `${fn} ${ln}`;
  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`;
  const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
  const address = areas[i % areas.length];
  const since = randomPastDate(700).toISOString();
  insCust.run(cid, name, email, phone, address, since);

  const numVehicles = Math.random() < 0.25 ? 2 : 1;
  vehiclesByCustomer[cid] = [];
  for (let v = 0; v < numVehicles; v++) {
    const vid = id();
    const [make, models] = carMakes[Math.floor(Math.random() * carMakes.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const state = stateCodes[Math.floor(Math.random() * stateCodes.length)];
    const regNumber = `${state} ${String(Math.floor(Math.random() * 9000) + 1000)}`;
    insVeh.run(vid, cid, make, model, regNumber);
    vehiclesByCustomer[cid].push(vid);
  }
}

// ---- Bookings ----
const insBooking = db.prepare(`
  INSERT INTO Booking (id, code, customerId, vehicleId, serviceId, mechanicId, status, amount, address, notes, scheduledAt, createdAt, updatedAt)
  VALUES (@id, @code, @customerId, @vehicleId, @serviceId, @mechanicId, @status, @amount, @address, @notes, @scheduledAt, @createdAt, @updatedAt)
`);
const insHistory = db.prepare(
  `INSERT INTO BookingStatusHistory (id, bookingId, status, changedAt, note) VALUES (?, ?, ?, ?, ?)`
);
const insNotif = db.prepare(
  `INSERT INTO Notification (id, message, read, bookingId, createdAt) VALUES (?, ?, ?, ?, ?)`
);

const svcRows = db.prepare(`SELECT id, name, basePrice FROM Service`).all() as { id: string; name: string; basePrice: number }[];
const statusWeights: [string, number][] = [
  ["COMPLETED", 55],
  ["PENDING", 10],
  ["ASSIGNED", 8],
  ["ON_THE_WAY", 5],
  ["IN_PROGRESS", 7],
  ["CANCELLED", 15],
];
function weightedStatus(): string {
  const total = statusWeights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [status, w] of statusWeights) {
    if (r < w) return status;
    r -= w;
  }
  return "COMPLETED";
}

let bookingCounter = 1000;
const notes = [
  "Customer requested early morning slot",
  "Vehicle making unusual noise on braking",
  "Follow-up from previous service",
  "Customer will wait at location",
  "Parking available in basement",
  null, null, null,
];

for (let i = 0; i < 540; i++) {
  const bid = id();
  const code = `BK-${bookingCounter++}`;
  const cid = customerIds[Math.floor(Math.random() * customerIds.length)];
  const vehicles = vehiclesByCustomer[cid];
  const vid = vehicles[Math.floor(Math.random() * vehicles.length)];
  const svc = svcRows[Math.floor(Math.random() * svcRows.length)];
  const status = weightedStatus();
  const mechanicId =
    status === "PENDING" ? null : mechanicIds[Math.floor(Math.random() * mechanicIds.length)];
  const amount = Math.round(svc.basePrice * (0.9 + Math.random() * 0.3));
  const address = areas[Math.floor(Math.random() * areas.length)];
  const note = notes[Math.floor(Math.random() * notes.length)];

  // Spread scheduled dates across past 90 days + a few days into the future
  const daysOffset = Math.floor(Math.random() * 100) - 10; // -10 (future) .. 89 (past)
  const scheduled = new Date();
  scheduled.setDate(scheduled.getDate() - daysOffset);
  scheduled.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

  const createdAt = new Date(scheduled);
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 3) - 1);
  const updatedAt = status === "PENDING" ? createdAt : new Date(scheduled);

  insBooking.run({
    id: bid,
    code,
    customerId: cid,
    vehicleId: vid,
    serviceId: svc.id,
    mechanicId,
    status,
    amount,
    address,
    notes: note,
    scheduledAt: scheduled.toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  });

  // status history trail
  const trail =
    status === "CANCELLED"
      ? ["PENDING", "CANCELLED"]
      : status === "PENDING"
      ? ["PENDING"]
      : status === "ASSIGNED"
      ? ["PENDING", "ASSIGNED"]
      : status === "ON_THE_WAY"
      ? ["PENDING", "ASSIGNED", "ON_THE_WAY"]
      : status === "IN_PROGRESS"
      ? ["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS"]
      : ["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"];
  let t = new Date(createdAt);
  for (const s of trail) {
    insHistory.run(id(), bid, s, t.toISOString(), null);
    t = new Date(t.getTime() + 1000 * 60 * 30);
  }

  // Recent bookings get a notification
  if (daysOffset < 3 && Math.random() < 0.6) {
    const msgMap: Record<string, string> = {
      PENDING: `New booking received: ${code}.`,
      ASSIGNED: `Booking ${code} has been assigned to a mechanic.`,
      ON_THE_WAY: `Mechanic is now on the way for booking ${code}.`,
      IN_PROGRESS: `Booking ${code} is now in progress.`,
      COMPLETED: `Booking ${code} has been completed.`,
      CANCELLED: `Booking ${code} was cancelled.`,
    };
    insNotif.run(id(), msgMap[status], 0, bid, updatedAt.toISOString());
  }
}

const counts = db.prepare(`SELECT
  (SELECT COUNT(*) FROM Customer) as customers,
  (SELECT COUNT(*) FROM Mechanic) as mechanics,
  (SELECT COUNT(*) FROM Vehicle) as vehicles,
  (SELECT COUNT(*) FROM Booking) as bookings,
  (SELECT COUNT(*) FROM Service) as services
`).get();

console.log("Seed complete:", counts);
console.log("Login: admin@vsod.in / password123 (ADMIN), ops@vsod.in / password123 (OPERATIONS)");
