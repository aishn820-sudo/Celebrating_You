import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized administrative credentials" }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Unauthorized administrative credentials" }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: "ADMIN",
    });

    // Record audit log for admin login
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: "ADMIN_LOGIN",
        targetEntity: "User",
        targetId: user.id,
        newValue: "Admin logged in successfully",
        ipAddress: req.headers.get("x-forwarded-for") || "local",
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: "ADMIN",
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
    console.error("Admin login error:", err);
    if (err.code === "P1000" || err.code === "P1001" || err.name === "PrismaClientInitializationError") {
      return NextResponse.json(
        { error: "Database connection failure: Unable to reach database server. Please verify database connectivity." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message || "Admin login failed" }, { status: 500 });
  }
}

