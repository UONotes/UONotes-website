import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "UONotes Contact Form <noreply@uonotes.ca>",
      to: "uofonotes@gmail.com",
      replyTo: email,
      subject: `New contact form message from ${name}`,
      text: `From: ${name} (${email})\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}