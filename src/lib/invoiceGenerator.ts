import prisma from "./prisma";

export async function generateInvoiceForTransaction({
  bookingId,
  transactionId,
  type,
}: {
  bookingId: string;
  transactionId: string;
  type: "ADVANCE" | "FINAL";
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      vendor: { include: { category: true } },
      service: { include: { category: true } },
      package: true,
    },
  });

  if (!booking) throw new Error("Booking not found");

  const txn = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!txn || txn.status !== "SUCCESS") {
    throw new Error("Cannot generate invoice for unconfirmed or failed transaction");
  }

  // Check if invoice already exists for this transaction (idempotency)
  const existingInvoice = await prisma.invoice.findFirst({
    where: { transactionId },
  });
  if (existingInvoice) {
    return existingInvoice;
  }

  const dateStr = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const docTypePrefix = type === "ADVANCE" ? "ADV" : "FIN";
  const invoiceNumber = `CY-INV-${docTypePrefix}-${dateStr}-${randomSuffix}`;

  // GST Calculation & Tax Treatment:
  // Strictly conditional on vendor GSTIN validity and specific service category
  const gstin = booking.vendor.gstin?.trim();
  const isGstRegistered = Boolean(
    gstin &&
    gstin !== "N/A" &&
    gstin.length >= 15 &&
    !gstin.toLowerCase().includes("unregistered")
  );

  let taxAmount = 0;
  if (isGstRegistered) {
    const categoryName = (
      booking.service.category?.name ||
      booking.vendor.category?.name ||
      ""
    ).toLowerCase();

    // Indian GST SAC Code & Rate Matrix:
    // Catering, Food, Confectionery & Beverage (SAC 9963): 5% GST
    // Professional Photography, Staging, Styling, Decor, Technical (SAC 9983/9997): 18% GST
    if (categoryName.includes("cater") || categoryName.includes("food") || categoryName.includes("bakery")) {
      taxAmount = Math.round((txn.amount * 5) / 105);
    } else {
      taxAmount = Math.round((txn.amount * 18) / 118);
    }
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      bookingId,
      transactionId,
      type,
      customerName: booking.customer.name,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      customerAddress: booking.customer.address || booking.locationAddress || "",
      vendorBusinessName: booking.vendor.businessName,
      vendorGstin: isGstRegistered ? gstin : "Not Applicable (Unregistered)",
      vendorPan: booking.vendor.panNumber || "N/A",
      vendorAddress: `${booking.vendor.city}, ${booking.vendor.state}`,
      serviceTitle: booking.service.title,
      packageName: booking.package?.name || "Standard Booking",
      agreedServiceValue: booking.agreedServiceValue,
      advancePaid: type === "FINAL" ? booking.advancePaid : txn.amount,
      amountPaidThisDoc: txn.amount,
      remainingBalanceDue: type === "ADVANCE" ? (booking.agreedServiceValue - txn.amount) : 0,
      taxAmount,
      status: "PAID",
      paymentDate: txn.paidAt || new Date(),
    },
  });

  return invoice;
}
