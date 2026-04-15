'use client';

import { useMemo, useState } from 'react';
import { deletionReasons } from './reasons';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = {
  email: '',
  username: '',
  reason: '',
  otherReason: '',
  message: '',
  password: '',
};

export default function DeletionForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const validate = () => {
    const validationErrors = {};
    if (!emailPattern.test(form.email)) {
      validationErrors.email = 'البريد الإلكتروني غير صالح.';
    }
    if (!form.username.trim()) {
      validationErrors.username = 'اسم المستخدم مطلوب.';
    }
    if (!form.reason) {
      validationErrors.reason = 'اختر سبباً للحذف.';
    }
    if (form.reason === 'other' && !form.otherReason.trim()) {
      validationErrors.otherReason = 'صف سبب الحذف.';
    }
    if (!form.password.trim()) {
      validationErrors.password = 'تأكيد كلمة المرور مطلوب.';
    }
    return validationErrors;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setStatus({ type: 'error', message: 'يرجى تكملة الحقول المطلوبة.' });
      return;
    }
    setModalOpen(true);
  };

  const selectedReason = useMemo(() => deletionReasons.find((option) => option.value === form.reason), [form.reason]);

  const handleConfirm = async () => {
    setModalOpen(false);
    setIsSubmitting(true);
    setStatus({ type: 'pending', message: 'يتم إرسال طلب الحذف...' });

    try {
      const response = await fetch('/api/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          username: form.username.trim(),
          reason: form.reason,
          otherReason: form.otherReason.trim(),
          message: form.message.trim(),
          password: form.password.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload.errors) {
          setErrors(payload.errors);
          setStatus({ type: 'error', message: payload.message || 'هناك حقول تحتاج التعديل.' });
        } else {
          setStatus({ type: 'error', message: payload.message || 'فشل إرسال الطلب.' });
        }
        return;
      }

      setStatus({ type: 'success', message: 'تم إرسال الطلب وسيتم مراجعته.' });
      setForm(initialForm);
    } catch (error) {
      setStatus({ type: 'error', message: 'تعذر إرسال الطلب. حاول لاحقاً.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-black/10 bg-white/95 p-8 shadow-sm dark:bg-gray-900"
        noValidate
      >
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
            <span>البريد الإلكتروني *</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:border-gray-800 ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
              placeholder="example@domain.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </label>

          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>اسم المستخدم *</span>
            <input
              type="text"
              value={form.username}
              onChange={handleChange('username')}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:border-gray-800 ${
                  errors.username ? 'border-red-400' : 'border-gray-200'
                }`}
              placeholder="username123"
            />
            {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
          </label>
        </div>

        <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <span>سبب الحذف</span>
          <select
            value={form.reason}
            onChange={handleChange('reason')}
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:border-gray-800 ${
              errors.reason ? 'border-red-400' : 'border-gray-200'
            }`}
          >
            <option value="">اختر سبباً</option>
            {deletionReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
          {selectedReason && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedReason.label}
              {form.reason === 'other' && form.otherReason ? ` — ${form.otherReason}` : ''}
            </p>
          )}
        </label>

        {form.reason === 'other' && (
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>صف سببك</span>
            <input
              type="text"
              value={form.otherReason}
              onChange={handleChange('otherReason')}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:border-gray-800 ${
                errors.otherReason ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.otherReason && <p className="text-xs text-red-500">{errors.otherReason}</p>}
          </label>
        )}

        <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <span>رسالة إضافية</span>
          <textarea
            rows={4}
            value={form.message}
            onChange={handleChange('message')}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:border-gray-800"
            placeholder="أخبرنا بأي تفاصيل إضافية تود مشاركتها"
          />
        </label>

        <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <span>تأكيد كلمة المرور *</span>
          <input
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:border-gray-800 ${
              errors.password ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
        >
          {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الحذف'}
        </button>
      </form>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-right shadow-2xl dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">تأكيد حذف الحساب</h3>
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
              هل أنت متأكد أنك تريد حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                type="button"
                className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-900 dark:border-gray-700 dark:text-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirm}
                type="button"
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                نعم، احذف الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
