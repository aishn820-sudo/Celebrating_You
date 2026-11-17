import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        customer: true,
        vendor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Role safety check: Customer/Vendor portal login cannot log in as ADMIN
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Administrative accounts must log in via the dedicated Admin Portal" },
        { status: 403 }
      );
    }

    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `Account registered as ${user.role}. Please select correct login portal.` },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "CUSTOMER" | "VENDOR",
      customerId: user.customer?.id,
      vendorId: user.vendor?.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        customer: user.customer,
        vendor: user.vendor,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("cy_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}

