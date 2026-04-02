import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, businessName } = await req.json();

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User and Merchant in an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const merchant = await tx.merchant.create({
        data: {
          name: businessName,
          whatsappNumber: `placeholder-${user.id}`, // Merchant must provide real number in settings
          userId: user.id,
        },
      });

      return { user, merchant };
    });

    return NextResponse.json({
      message: "Registration successful",
      userId: result.user.id,
      merchantId: result.merchant.id,
    });
  } catch (err: unknown) {
    console.error("[API/Register] Error:", err);
    return NextResponse.json(
      { message: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
