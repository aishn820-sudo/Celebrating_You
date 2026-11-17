import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "VENDOR" || !session.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "ADVANCE" | "FINAL"
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const whereClause: any = {
      booking: {
        vendorId: session.vendorId,
      },
    };

    if (type && ["ADVANCE", "FINAL"].includes(type)) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { booking: { bookingCode: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            eventDate: true,
            agreedServiceValue: true,
            advancePaid: true,
            finalPaid: true,
            finalBalanceDue: true,
            event: {
              select: {
                id: true,
                title: true,
                eventType: true,
              },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            transactionRef: true,
            gatewayProvider: true,
            gatewayPaymentId: true,
            paidAt: true,
            status: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    // Compute vendor summary totals
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amountPaidThisDoc, 0);
    const advanceInvoices = invoices.filter((inv) => inv.type === "ADVANCE");
    const finalInvoices = invoices.filter((inv) => inv.type === "FINAL");

    return NextResponse.json({
      invoices,
      metrics: {
        totalDocuments: invoices.length,
        totalInvoicedAmount: totalInvoiced,
        advanceCount: advanceInvoices.length,
        advanceTotal: advanceInvoices.reduce((sum, inv) => sum + inv.amountPaidThisDoc, 0),
        finalCount: finalInvoices.length,
        finalTotal: finalInvoices.reduce((sum, inv) => sum + inv.amountPaidThisDoc, 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

