import { PrismaClient, OrderStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dummy store data for active user...');

  // 1. Find or create an Organization
  const userId = 'cmnh5ydsk0001xnbaqmlc1h8y'; // Replace with your actual user ID
  
  // Find user's org membership
  let membership = await prisma.orgMember.findFirst({
    where: { user: { id: userId } },
    include: { org: true },
  });

  if (!membership) {
    // Create org + membership if none exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error('❌ No user found. Please register first.');
      process.exit(1);
    }

    const org = await prisma.organization.create({
      data: {
        name: 'StyleHouse India',
        slug: 'stylehouse',
        whatsappNumber: '919876543210',
        storeCode: 'STYLEHOUSE',
        whatsappConnected: true,
        razorpayKeyId: 'rzp_test_demo',
        razorpayKeySecret: 'demo_secret',
        aiContext: 'StyleHouse Boutique is a premium apparel brand based in Mumbai.',
        onboardingCompleted: true,
        selectedTemplate: 'sell_products',
      },
    });

    membership = await prisma.orgMember.create({
      data: { orgId: org.id, userId: user.id, email: user.email!, role: 'OWNER', isActive: true, joinedAt: new Date() },
      include: { org: true },
    });
  }

  const org = membership.org;

  // 2. Update the org with demo credentials
  const updatedOrg = await prisma.organization.update({
    where: { id: org.id },
    data: {
      whatsappNumber: '919876543210',
      storeCode: 'STYLEHOUSE',
      whatsappConnected: true,
      razorpayKeyId: 'rzp_test_demo',
      razorpayKeySecret: 'demo_secret',
      aiContext: 'StyleHouse Boutique is a premium apparel brand based in Mumbai, specializing in contemporary Indian wear.',
      onboardingCompleted: true,
      selectedTemplate: 'sell_products',
    },
  });

  console.log(`✅ Organization updated: ${updatedOrg.name} (${updatedOrg.id})`);

  // 2.5. Create Default Automation Rules
  console.log('🤖 Creating default automation rules...');
  await prisma.automationRule.deleteMany({ where: { orgId: updatedOrg.id } });
  
  await prisma.automationRule.createMany({
    data: [
      {
        orgId: updatedOrg.id,
        name: "Welcome Greeting",
        isActive: true,
        priority: 10,
        trigger: "FIRST_MESSAGE",
        matchMode: "EXACT",
        keywords: [],
        action: "SEND_GREETING",
      },
      {
        orgId: updatedOrg.id,
        name: "Show Catalog",
        isActive: true,
        priority: 20,
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["catalog", "menu", "products", "items"],
        action: "SEND_CATALOG",
      },
      {
        orgId: updatedOrg.id,
        name: "Out of Hours Auto-Reply",
        isActive: true,
        priority: 30,
        trigger: "OUTSIDE_HOURS",
        matchMode: "EXACT",
        keywords: [],
        action: "SEND_TEXT",
        responseText: "Hi! We are currently closed. We have received your message and will get back to you during business hours. For urgent queries, please leave details.",
      },
      {
        orgId: updatedOrg.id,
        name: "AI Fallback",
        isActive: true,
        priority: 100,
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
      }
    ]
  });
  console.log(`✅ Default Automation Rules created.`);

  // 3. Create Sample Products
  const productsData = [
    { name: 'Indigo Cotton Kurta', price: 1499, stock: 45 },
    { name: 'Silk Embroidered Saree', price: 4999, stock: 12 },
    { name: 'Floral Maxi Dress', price: 2499, stock: 25 },
    { name: 'Gold-Plated Jhumkas', price: 1299, stock: 50 },
    { name: 'Handcrafted Leather Bag', price: 3499, stock: 8 },
    { name: 'Linen Trousers', price: 1899, stock: 30 },
  ];

  const products = [];
  for (const item of productsData) {
    const p = await prisma.product.create({
      data: {
        orgId: updatedOrg.id,
        name: item.name,
        price: item.price,
        stock: item.stock,
        description: `Premium ${item.name} from our latest collection.`,
        isActive: true,
      },
    });
    products.push(p);
  }

  console.log(`✅ ${products.length} Products created.`);

  // 4. Create Sample Contacts
  const contactNames = [
    'Aditi Sharma', 'Rohan Gupta', 'Sneha Patel', 'Ananya Singh', 'Vikram Rao',
    'Ishani Mehta', 'Karan Malhotra', 'Pooja Iyer', 'Rahul Verma', 'Divya Reddy',
  ];

  const contacts = [];
  for (let i = 0; i < contactNames.length; i++) {
    const c = await prisma.contact.upsert({
      where: { orgId_waId: { orgId: updatedOrg.id, waId: `91900000000${i}` } },
      update: {},
      create: {
        orgId: updatedOrg.id,
        name: contactNames[i],
        waId: `91900000000${i}`,
      },
    });
    contacts.push(c);
  }

  console.log(`✅ ${contacts.length} Contacts ensured.`);

  // 5. Create Mock Orders (last 30 days)
  console.log('📦 Generating mock orders...');
  const now = new Date();
  let orderCount = 0;

  for (let i = 0; i < 40; i++) {
    const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
    const randomProductCount = Math.floor(Math.random() * 2) + 1;
    const selectedProducts = [];

    for (let j = 0; j < randomProductCount; j++) {
      selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
    }

    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(now.getDate() - daysAgo);

    const totalAmount = selectedProducts.reduce((sum, p) => sum + Number(p.price), 0);

    await prisma.order.create({
      data: {
        orgId: updatedOrg.id,
        contactId: randomContact.id,
        status: OrderStatus.PAID,
        totalAmount: totalAmount,
        createdAt: orderDate,
        items: {
          create: selectedProducts.map((p) => ({
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
