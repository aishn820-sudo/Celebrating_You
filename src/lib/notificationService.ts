import prisma from "./prisma";

export interface CreateNotificationParams {
  userId: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  title: string;
  message: string;
  link?: string;
  type?: "BOOKING" | "PAYMENT" | "SYSTEM" | "ALERT";
}

export async function sendNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        role: params.role,
        title: params.title,
        message: params.message,
        link: params.link,
        type: params.type || "BOOKING",
      },
    });

    // Email Dispatch Pipeline
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true },
    });

    if (user?.email) {
      await dispatchEmail({
        to: user.email,
        subject: `[Celebrating YOU] ${params.title}`,
        text: `${params.message}\n\nView details: ${params.link || "https://celebratingyou.com"}`,
      });
    }

    return notification;
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

async function dispatchEmail(options: EmailOptions) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  if (resendApiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Celebrating YOU <notifications@celebratingyou.com>",
          to: [options.to],
          subject: options.subject,
          text: options.text,
        }),
      });
    } catch (e) {
      console.error("Resend API error:", e);
    }
  } else {
    // In development / test environment, trace outgoing notification email envelope
    console.log(`[EMAIL DISPATCH] To: ${options.to} | Subject: "${options.subject}"`);
  }
}
