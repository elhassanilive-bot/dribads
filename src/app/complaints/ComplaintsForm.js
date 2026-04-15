'use client';

import { useState } from 'react';
import { reportTypes } from './reportTypes';

const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;
const initialForm = {
  name: '',
  email: '',
  reportType: '',
  target: '',
  description: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Icon({ name, className = 'h-5 w-5' }) {
  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    className,
  };

  switch (name) {
    case 'user':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-3.5 3.5-6 6-6s6 2.5 6 6" />
        </svg>
      );
    case 'post':
      return (
        <svg {...baseProps}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M8 10h8" />
          <path d="M8 14h6" />
        </svg>
      );
    case 'message':
      return (
        <svg {...baseProps}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M8 11h8M8 15h6" />
        </svg>
      );
    case 'channels':
      return (
        <svg {...baseProps}>
          <rect x="6" y="8" width="12" height="8" rx="2" />
          <path d="M16 12h-8" />
          <path d="M12 8v-2" />
        </svg>
      );
    case 'bug':
      return (
        <svg {...baseProps}>
          <rect x="7" y="6" width="10" height="12" rx="3" />
          <line x1="12" y1="6" x2="12" y2="4" />
          <line x1="9" y1="20" x2="9" y2="22" />
          <line x1="15" y1="20" x2="15" y2="22" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...baseProps}>
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.5 9.5h4" />
          <path d="M15.5 9.5h4" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
  }
}


export default function ComplaintsForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidence, setEvidence] = useState(null);
  const [evidenceError, setEvidenceError] = useState('');

  const validate = () => {
    const validationErrors = {};
    if (!form.email.trim()) {
      validationErrors.email = 'البريد الإلكتروني مطلوب.';
    } else if (!emailPattern.test(form.email)) {
      validationErrors.email = 'الرجاء إدخال بريد إلكتروني صالح.';
    }
    if (!form.reportType) {
      validationErrors.reportType = 'اختر نوع البلاغ.';
    }
    if (!form.target.trim()) {
      validationErrors.target = 'الرابط أو اسم المستخدم مطلوب.';
    }
    if (!form.description.trim()) {
      validationErrors.description = 'وصف المشكلة مطلوب.';
    }
    return validationErrors;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTypeSelect = (type) => {
    setForm((prev) => ({ ...prev, reportType: type }));
    setErrors((prev) => ({ ...prev, reportType: undefined }));
  };

  const handleEvidence = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setEvidence(null);
      setEvidenceError('');
      return;
    }

    if (file.size > MAX_EVIDENCE_SIZE) {
      setEvidence(null);
      setEvidenceError('تجاوز الملف الحد المسموح به (5 ميغابايت).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] ?? '';
        setEvidence({ name: file.name, data: base64 });
        setEvidenceError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setStatus({ type: 'error', message: 'يجب تصحيح الحقول المطلوبة.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'pending', message: 'جاري إرسال البلاغ...' });

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          reportType: form.reportType,
          target: form.target.trim(),
          description: form.description.trim(),
          evidenceName: evidence?.name,
          evidenceData: evidence?.data,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload.errors) {
          setErrors(payload.errors);
          setStatus({ type: 'error', message: 'هناك قيم بحاجة للتصحيح.' });
        } else {
          setStatus({ type: 'error', message: payload.message || 'فشل إرسال البلاغ.' });
        }
        return;
      }

      setStatus({ type: 'success', message: 'تم إرسال البلاغ وسيتم مراجعته.' });
      setForm(initialForm);
      setEvidence(null);
    } catch (error) {
      setStatus({ type: 'error', message: 'تعذر إرسال البلاغ. حاول لاحقًا.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = reportTypes.find((type) => type.value === form.reportType);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
      <form className="rounded-3xl border border-black/10 bg-white/95 p-8 shadow-sm dark:bg-gray-900" onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {status.message && (
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                status.type === 'success'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : status.type === 'error'
                  ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-200'
                  : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <span>الاسم الكامل</span>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>

            <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <span>البريد الإلكتروني *</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="example@domain.com"
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 dark:bg-gray-900 dark:border-gray-800 ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">اختر نوع البلاغ *</p>
            <div className="grid gap-3 md:grid-cols-3">
              {reportTypes.map((type) => {
                const isActive = form.reportType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`flex flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-sm transition-all ${
                      isActive
                        ? 'border-black bg-black/[0.04] text-black shadow-sm dark:border-white/20 dark:bg-white/5'
                        : 'border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-black">
                      <Icon name={type.icon} className="h-5 w-5" />
                      <span className="font-semibold">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.reportType && <p className="text-xs text-red-500">{errors.reportType}</p>}
          </div>

          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>رابط المحتوى أو اسم المستخدم *</span>
            <input
              type="text"
              value={form.target}
              onChange={handleChange('target')}
              placeholder="https://dribdo.com/post/..."
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 dark:bg-gray-900 dark:border-gray-800 ${
                errors.target ? 'border-red-400' : 'border-gray-200'
              }`}
              aria-invalid={Boolean(errors.target)}
              aria-describedby="target-error"
            />
            {errors.target && (
              <p id="target-error" className="text-xs text-red-500">
                {errors.target}
              </p>
            )}
          </label>

          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>وصف المشكلة *</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={handleChange('description')}
              placeholder="صف تفاصيل البلاغ والمشكلة بدقة"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 dark:bg-gray-900 dark:border-gray-800 ${
                errors.description ? 'border-red-400' : 'border-gray-200'
              }`}
              aria-invalid={Boolean(errors.description)}
              aria-describedby="description-error"
            />
            {errors.description && (
              <p id="description-error" className="text-xs text-red-500">
                {errors.description}
              </p>
            )}
          </label>

          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>إرفاق دليل (اختياري)</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleEvidence}
              className="text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-black/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black dark:file:bg-white/10 dark:file:text-white"
            />
            {evidence?.name && <p className="text-xs text-gray-500">المرفق: {evidence.name}</p>}
            {evidenceError && <p className="text-xs text-red-500">{evidenceError}</p>}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
          </button>
        </div>
      </form>

      <aside className="space-y-6 rounded-3xl border border-black/10 bg-[#faf8f6] p-8 text-gray-700 shadow-sm dark:from-gray-900 dark:to-gray-950 dark:text-gray-100">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white">
            <Icon name={selectedType?.icon ?? 'sparkles'} className="h-6 w-6 text-black" />
            معلومات إضافية
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
            استخدم هذا النموذج للإبلاغ عن محتوى مخالف، إساءة استخدام، انتحال شخصية، مشاكل تقنية مؤثرة، أو أي تصرف يخلّ بسياسات دريبدو.
            كل بلاغ تتم مراجعته بحسب نوعه ودرجة خطورته.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <Icon name="mail" className="h-5 w-5 text-black" />
            <a href="mailto:support@dribdo.com" className="font-semibold text-black hover:underline">
              support@dribdo.com
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Icon name="shield" className="h-5 w-5 text-black" />
            رقم الهاتف: <span className="font-semibold text-black">+212638813823</span>
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.4em] text-black/45">تأكد من توضيح التفاصيل قدر الإمكان</p>
      </aside>
    </div>
  );
}

