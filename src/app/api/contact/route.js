import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 6;
const rateLimitStore = new Map();

let transporter;

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function enforceRateLimit(request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, expires: 0 };

  if (entry.expires < now) {
    entry.count = 0;
    entry.expires = now + RATE_LIMIT_WINDOW_MS;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return true;
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = port === 465;

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP configuration. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS.');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

function buildMessage({ fullName, email, subject, message }) {
  const now = new Date().toISOString();
  const sanitizedSubject = subject ? subject : 'بدون موضوع';
  return `اسم المرسل: ${fullName}\nالبريد الإلكتروني: ${email}\nالموضوع: ${sanitizedSubject}\nنص الرسالة:\n${message}\n\nتاريخ الإرسال: ${now}`;
}

export async function POST(request) {
  if (!enforceRateLimit(request)) {
    return NextResponse.json({ message: 'تم الوصول للحد الأقصى للإرسال. حاول لاحقاً.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'الطلب غير صالح.' }, { status: 400 });
  }

  const errors = {};
  if (!body.fullName?.trim()) {
    errors.fullName = 'الاسم الكامل مطلوب.';
  }
  if (!body.email?.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = 'الرجاء إدخال بريد إلكتروني صالح.';
  }
  if (!body.message?.trim()) {
    errors.message = 'نص الرسالة مطلوب.';
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors, message: 'استكمل الحقول المطلوبة.' }, { status: 400 });
  }

  const payload = {
    fullName: body.fullName.trim(),
    email: body.email.trim(),
    subject: body.subject?.trim() ?? '',
    message: body.message.trim(),
  };

  try {
    const currentTransporter = getTransporter();
    await currentTransporter.sendMail({
      from: process.env.EMAIL_FROM ?? 'Dribdo <no-reply@dribdo.com>',
      to: process.env.CONTACT_RECIPIENT ?? 'support@dribdo.com',
      replyTo: payload.email,
      subject: `رسالة من ${payload.fullName}${payload.subject ? ` - ${payload.subject}` : ''}`,
      text: buildMessage(payload),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('contact mail error', error);
    const message = error instanceof Error ? error.message : 'فشل إرسال الرسالة.';
    return NextResponse.json({ message: 'تعذر إرسال الرسالة. ' + message }, { status: 500 });
  }
}
