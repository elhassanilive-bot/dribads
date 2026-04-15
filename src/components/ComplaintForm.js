'use client';

import { useState } from "react";

export default function ComplaintForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "محتوى مسيء",
    details: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus("تم استلام البلاغ، وسنتواصل معك إذا احتجنا إلى معلومات إضافية.");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 space-y-4 shadow-sm">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">أرسل شكوى أو بلاغ</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block text-gray-700 dark:text-gray-200">
          الاسم
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none"
          />
        </label>
        <label className="block text-gray-700 dark:text-gray-200">
          البريد الإلكتروني
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block text-gray-700 dark:text-gray-200">
        نوع الشكوى
        <select
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none"
        >
          <option>محتوى مسيء</option>
          <option>انتحال هوية / حقوق نشر</option>
          <option>مشكلة تقنية</option>
          <option>طلب دعم عام</option>
        </select>
      </label>
      <label className="block text-gray-700 dark:text-gray-200">
        تفاصيل البلاغ
        <textarea
          name="details"
          value={formData.details}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 px-8 py-2 text-white font-semibold transition-colors"
      >
        إرسال البلاغ
      </button>
      {status && <p className="text-sm text-green-500">{status}</p>}
    </form>
  );
}
