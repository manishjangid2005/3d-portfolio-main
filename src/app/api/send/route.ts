import { EmailTemplate } from "@/components/email-template";
import { NextResponse } from 'next/server';

import { config } from "@/data/config";
import { Resend } from "resend";
import { z } from "zod";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(req: Request) {
  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    const body = await req.json();
    const {
      success: zodSuccess,
      data: zodData,
      error: zodError,
    } = Email.safeParse(body);

    if (!zodSuccess) {
      return NextResponse.json({ error: zodError?.message }, { status: 400 });
    }

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Porfolio <onboarding@resend.dev>",
      to: [config.email],
      subject: "Contact me from portfolio",
      react: EmailTemplate({
        fullName: zodData.fullName,
        email: zodData.email,
        message: zodData.message,
      }),
    });

    if (resendError) {
      return NextResponse.json({ resendError }, { status: 500 });
    }

    return NextResponse.json(resendData);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Email schema (keep outside the handler)
const Email = z.object({
  fullName: z.string().min(2, "Full name is invalid!"),
  email: z.string().email({ message: "Email is invalid!" }),
  message: z.string().min(10, "Message is too short!"),
});
