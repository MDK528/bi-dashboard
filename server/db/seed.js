require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { initDatabase, getDB } = require('./database');

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books', 'Automotive'];
const PRODUCTS = {
  Electronics: ['Laptop Pro', 'SmartPhone X', 'Tablet Air', 'Wireless Earbuds', 'Smart Watch', '4K Monitor', 'Gaming Console'],
  Clothing: ['Winter Jacket', 'Running Shoes', 'Casual Tee', 'Denim Jeans', 'Formal Suit', 'Summer Dress', 'Sneakers'],
  'Food & Beverage': ['Organic Coffee', 'Green Tea Pack', 'Protein Bars', 'Energy Drink', 'Smoothie Mix', 'Granola Pack'],
  'Home & Garden': ['Air Purifier', 'Robot Vacuum', 'LED Plant Lamp', 'Smart Thermostat', 'Water Filter', 'Cookware Set'],
  Sports: ['Yoga Mat', 'Resistance Bands', 'Dumbbell Set', 'Cycling Helmet', 'Swimming Goggles', 'Tennis Racket'],
  Books: ['Data Science 101', 'Leadership Mindset', 'The Art of War', 'Python Cookbook', 'Financial Freedom', 'UX Design Basics'],
  Automotive: ['Dash Cam', 'Car Vacuum', 'Tire Inflator', 'Phone Mount', 'Seat Covers', 'Jump Starter'],
};
const SALES_REPS = ['Alice Johnson', 'Bob Martinez', 'Carol White', 'David Lee', 'Emma Brown', 'Frank Garcia', 'Grace Kim', 'Henry Wilson'];
const CHANNELS = ['Online', 'Retail Store', 'Wholesale', 'Direct Sales'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await initDatabase();
  const db = getDB();

  console.log('🌱 Seeding database with demo data...');

  // Drop & recreate tables
  db.exec(`
    DROP TABLE IF EXISTS sales;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS monthly_targets;

    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL
    );

    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      region TEXT NOT NULL,
      segment TEXT NOT NULL,
      joined_date DATE NOT NULL
    );

    CREATE TABLE sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_date DATE NOT NULL,
      product_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      sales_rep TEXT NOT NULL,
      region TEXT NOT NULL,
      channel TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_pct REAL DEFAULT 0,
      revenue REAL NOT NULL,
      profit REAL NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE monthly_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      region TEXT NOT NULL,
      target_revenue REAL NOT NULL,
      target_units INTEGER NOT NULL
    );
  `);

  // Insert products
  const productInsert = db.prepare('INSERT INTO products (name, category, unit_price, cost_price, stock_quantity) VALUES (?, ?, ?, ?, ?)');
  const productIds = {};
  for (const [category, prods] of Object.entries(PRODUCTS)) {
    productIds[category] = [];
    for (const name of prods) {
      const price = randomFloat(15, 1500);
      const cost = parseFloat((price * randomFloat(0.4, 0.7)).toFixed(2));
      const result = productInsert.run(name, category, price, cost, randomInt(50, 500));
      productIds[category].push({ id: result.lastInsertRowid, price, cost });
    }
  }

  // Insert customers
  const customerInsert = db.prepare('INSERT INTO customers (name, email, region, segment, joined_date) VALUES (?, ?, ?, ?, ?)');
  const segments = ['Enterprise', 'SMB', 'Consumer', 'Government'];
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'Liam', 'Olivia', 'Noah', 'Emma', 'Aiden'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Moore', 'Jackson'];
  
  const customerIds = [];
  for (let i = 0; i < 300; i++) {
    const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    const region = randomChoice(REGIONS);
    const year = randomInt(2020, 2022);
    const month = String(randomInt(1, 12)).padStart(2, '0');
    const day = String(randomInt(1, 28)).padStart(2, '0');
    const result = customerInsert.run(
      name,
      `${name.toLowerCase().replace(' ', '.')}${i}@email.com`,
      region,
      randomChoice(segments),
      `${year}-${month}-${day}`
    );
    customerIds.push(result.lastInsertRowid);
  }

  // Insert monthly targets
  const targetInsert = db.prepare('INSERT INTO monthly_targets (year, month, region, target_revenue, target_units) VALUES (?, ?, ?, ?, ?)');
  for (let year = 2022; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      for (const region of REGIONS) {
        targetInsert.run(year, month, region, randomFloat(80000, 200000), randomInt(200, 600));
      }
    }
  }

  // Insert sales (3 years of data)
  const salesInsert = db.prepare(`
    INSERT INTO sales (order_date, product_id, customer_id, sales_rep, region, channel, quantity, unit_price, discount_pct, revenue, profit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records) => {
    for (const r of records) salesInsert.run(...r);
  });

  const records = [];
  for (let year = 2022; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === 2024 && month > 6) break; // Data up to June 2024
      const ordersThisMonth = randomInt(150, 400);
      for (let o = 0; o < ordersThisMonth; o++) {
        const category = randomChoice(CATEGORIES);
        const product = randomChoice(productIds[category]);
        const qty = randomInt(1, 10);
        const discount = randomChoice([0, 0, 0, 5, 10, 15, 20]) / 100;
        const revenue = parseFloat((product.price * qty * (1 - discount)).toFixed(2));
        const profit = parseFloat((revenue - product.cost * qty).toFixed(2));
        const day = String(randomInt(1, 28)).padStart(2, '0');
        records.push([
          `${year}-${String(month).padStart(2, '0')}-${day}`,
          product.id,
          randomChoice(customerIds),
          randomChoice(SALES_REPS),
          randomChoice(REGIONS),
          randomChoice(CHANNELS),
          qty,
          product.price,
          discount,
          revenue,
          profit,
        ]);
      }
    }
  }

  insertMany(records);

  const count = db.prepare('SELECT COUNT(*) as c FROM sales').get();
  console.log(`✅ Seeded ${count.c} sales records, ${customerIds.length} customers, products in ${CATEGORIES.length} categories.`);
  console.log('✅ Demo database ready!');
  process.exit(0);
}

seed().catch(console.error);
