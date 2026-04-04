import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jgxnshtupdrmwhxomzos:Na%40123%40%23%24nawaz@db.jgxnshtupdrmwhxomzos.supabase.co:5432/postgres?sslmode=require"
    }
  }
})

async function main() {
  try {
    const usersCount = await prisma.user.count()
    console.log(`Connection successful. Users count: ${usersCount}`)
  } catch (error) {
    console.error('Connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
