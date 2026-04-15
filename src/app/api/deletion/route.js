import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { deletionReasons } from '@/app/deletion/reasons';

const RATE_LIMIT_WINDOW_MS = 90 * 1000;
const MAX_REQUESTS_PER_WINDOW = 4;
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

function buildMessage(payload) {
  const now = new Date().toISOString();
  return `اسم المستخدم: ${payload.username}\nالبريد الإلكتروني: ${payload.email}\nسبب الحذف: ${payload.reasonLabel}\nالرسالة: ${payload.message || 'بدون رسالة'}\nتاريخ الطلب: ${now}`;
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
  if (!body.email?.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب.';
  }
  if (!body.username?.trim()) {
    errors.username = 'اسم المستخدم مطلوب.';
  }
  if (!body.reason) {
    errors.reason = 'سبب الحذف مطلوب.';
  }
  if (!body.password?.trim()) {
    errors.password = 'تأكيد كلمة المرور مطلوب.';
  }

  const reasonMeta = deletionReasons.find((item) => item.value === body.reason);
  if (!reasonMeta) {
    errors.reason = 'سبب الحذف غير صالح.';
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors, message: 'استكمل الحقول المطلوبة.' }, { status: 400 });
  }

  const payload = {
    username: body.username.trim(),
    email: body.email.trim(),
    reasonLabel: reasonMeta?.label ?? body.reason,
    message: body.message?.trim() ?? '',
  };

  try {
    const currentTransporter = getTransporter();
    await currentTransporter.sendMail({
      from: process.env.EMAIL_FROM ?? 'Dribdo <no-reply@dribdo.com>',
      to: process.env.CONTACT_RECIPIENT ?? 'support@dribdo.com',
      replyTo: payload.email,
      subject: `طلب حذف حساب - ${payload.username}`,
      text: buildMessage(payload),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('deletion mail error', error);
    const message = error instanceof Error ? error.message : 'فشل إرسال الطلب.';
    return NextResponse.json({ message: 'تعذر إرسال الطلب. ' + message }, { status: 500 });
  }
}
