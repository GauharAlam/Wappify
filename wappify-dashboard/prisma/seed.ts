import { PrismaClient, OrderStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dummy store data for active user...');

  // 1. Identify the active merchant with userId cmnh5ydsk0001xnbaqmlc1h8y
  const activeMerchant = await prisma.merchant.findFirst({
    where: { userId: 'cmnh5ydsk0001xnbaqmlc1h8y' }
  });

  if (!activeMerchant) {
    console.error('❌ No merchant found for user Gauhar Alam. Please create one first or register.');
    process.exit(1);
  }

  // 2. Update the existing merchant with demo credentials (to bypass onboarding)
  const updatedMerchant = await prisma.merchant.update({
    where: { id: activeMerchant.id },
    data: {
      whatsappNumber: "whatsapp:+14155238886",
      twilioAccountSid: "AC_MOCK_ACCOUNT_SID",
      twilioAuthToken: "MOCK_AUTH_TOKEN",
      razorpayKeyId: 'rzp_test_demo',
      razorpayKeySecret: 'demo_secret',
      aiContext: 'StyleHouse Boutique is a premium apparel brand based in Mumbai, specializing in contemporary Indian wear and accessories for modern women.',
    },
  });

  console.log(`✅ Merchant updated: ${updatedMerchant.name} (${updatedMerchant.id})`);

  // 3. Clear existing dummy products/orders for this merchant (optional, but keeps it clean)
  // await prisma.order.deleteMany({ where: { merchantId: updatedMerchant.id } });
  // await prisma.product.deleteMany({ where: { merchantId: updatedMerchant.id } });

  // 4. Create Sample Products
  const productsData = [
    { name: 'Indigo Cotton Kurta', price: 1499, stock: 45, category: 'Apparel' },
    { name: 'Silk Embroidered Saree', price: 4999, stock: 12, category: 'Apparel' },
    { name: 'Floral Maxi Dress', price: 2499, stock: 25, category: 'Apparel' },
    { name: 'Gold-Plated Jhumkas', price: 1299, stock: 50, category: 'Accessories' },
    { name: 'Handcrafted Leather Bag', price: 3499, stock: 8, category: 'Accessories' },
    { name: 'Linen Trousers', price: 1899, stock: 30, category: 'Apparel' },
  ];

  const products = [];
  for (const item of productsData) {
    const p = await prisma.product.create({
      data: {
        merchantId: updatedMerchant.id,
        name: item.name,
        price: item.price,
        stock: item.stock,
        description: `Premium ${item.name} from our latest ${item.category} collection.`,
        isActive: true,
      },
    });
    products.push(p);
  }

  console.log(`✅ ${products.length} Products created.`);

  // 5. Create Sample Customers (if not exists)
  const customerNames = [
    'Aditi Sharma', 'Rohan Gupta', 'Sneha Patel', 'Ananya Singh', 'Vikram Rao',
    'Ishani Mehta', 'Karan Malhotra', 'Pooja Iyer', 'Rahul Verma', 'Divya Reddy'
  ];

  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const c = await prisma.customer.upsert({
      where: { waId: `91900000000${i}` },
      update: {},
      create: {
        name: customerNames[i],
        waId: `91900000000${i}`,
      },
    });
    customers.push(c);
  }

  console.log(`✅ ${customers.length} Customers ensured.`);

  // 6. Create Mock Orders (last 30 days)
  console.log('📦 Generating mock orders...');
  const now = new Date();
  let orderCount = 0;

  for (let i = 0; i < 40; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomProductCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 products
    const selectedProducts = [];
    
    for (let j = 0; j < randomProductCount; j++) {
        selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
    }

    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(now.getDate() - daysAgo);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + Number(p.price), 0);

    const order = await prisma.order.create({
      data: {
        merchantId: updatedMerchant.id,
        customerId: randomCustomer.id,
        status: OrderStatus.PAID,
        totalAmount: totalAmount,
        createdAt: orderDate,
        items: {
          create: selectedProducts.map(p => ({
            productId: p.id,
            quantity: 1,
            priceAtTime: p.price,
          })),
        },
      },
    });
    orderCount++;
  }

  console.log(`✅ ${orderCount} Orders created.`);
  console.log('✨ Targeted seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
