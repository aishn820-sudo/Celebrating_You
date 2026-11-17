import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, address, city, state, pincode } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Name, email, phone, and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const count = await prisma.customer.count();
    const customerCode = `CY-CUST-${1000 + count + 1}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "CUSTOMER",
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerCode,
          name,
          phone,
          email: cleanEmail,
          address: address || "",
          city: city || "Bangalore",
          state: state || "Karnataka",
          pincode: pincode || "",
        },
      });

      return { user, customer };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      role: "CUSTOMER",
      customerId: result.customer.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: "CUSTOMER",
        customer: result.customer,
      },
    });

    response.cookies.set("cy_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}

