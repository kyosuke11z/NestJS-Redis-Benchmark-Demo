const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Automotive',
];

const REGIONS = [
  'North America',
  'Europe',
  'Asia-Pacific',
  'Latin America',
  'Middle East & Africa',
];

const PRODUCTS = {
  Electronics: ['Smart Watch', 'Wireless Earbuds', '4K Monitor', 'Smartphone', 'Bluetooth Speaker', 'Laptop Stand'],
  Fashion: ['Leather Jacket', 'Running Shoes', 'Designer Sunglasses', 'Denim Jeans', 'Wool Scarf', 'Cotton T-Shirt'],
  'Home & Kitchen': ['Air Fryer', 'Espresso Machine', 'Robot Vacuum', 'Slow Cooker', 'Memory Foam Pillow', 'Chef Knife Set'],
  Books: ['Sci-Fi Novel', 'Historical Biography', 'Self-Help Guide', 'Cooking Recipes', 'Tech Programming Manual', 'Fantasy Trilogy'],
  'Sports & Outdoors': ['Yoga Mat', 'Camping Tent', 'Water Bottle', 'Adjustable Dumbbells', 'Hiking Backpack', 'Cycling Helmet'],
  'Beauty & Personal Care': ['Face Serum', 'Electric Toothbrush', 'Hair Dryer', 'Moisturizing Cream', 'Essential Oil Diffuser'],
  Automotive: ['Car Phone Mount', 'Dash Cam', 'Seat Cushion', 'Portable Air Compressor', 'LED Headlights', 'Car Wax Kit'],
};

async function main() {
  console.log('Checking database status...');
  const count = await prisma.sale.count();
  
  if (count >= 500000) {
    console.log(`Database already has ${count} records. Seeding skipped.`);
    return;
  }

  console.log('Emptying sales table...');
  await prisma.sale.deleteMany({});

  const totalRecords = 500000;
  const batchSize = 25000;
  const totalBatches = totalRecords / batchSize;

  console.log(`Starting to seed ${totalRecords} records in ${totalBatches} batches...`);
  
  const start = Date.now();

  for (let batch = 0; batch < totalBatches; batch++) {
    const data = [];
    for (let i = 0; i < batchSize; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const products = PRODUCTS[category];
      const productName = products[Math.floor(Math.random() * products.length)];
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      
      const amount = parseFloat((Math.random() * 500 + 5).toFixed(2));
      const quantity = Math.floor(Math.random() * 10) + 1;
      
      // Random date in the last 12 months
      const soldAt = new Date();
      soldAt.setDate(soldAt.getDate() - Math.floor(Math.random() * 365));

      data.push({
        productName,
        category,
        amount,
        quantity,
        soldAt,
        region,
      });
    }

    await prisma.sale.createMany({
      data,
      skipDuplicates: true,
    });

    console.log(`Seeded batch ${batch + 1}/${totalBatches} (${(batch + 1) * batchSize} records)...`);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Successfully seeded ${totalRecords} records in ${duration} seconds.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
