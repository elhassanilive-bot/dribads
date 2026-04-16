import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const metadata = {
  title: "إدارة KYC",
  description: "لوحة مراجعة وتحديث حالة تحقق الناشرين (KYC).",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/kyc" },
};

const VALID_STATUSES = ["pending", "in_review", "verified", "rejected"];

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  in_review: "قيد المراجعة",
  verified: "موثق",
  rejected: "مرفوض",
};

function statusBadgeClass(status) {
  if (status === "verified") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "in_review") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function SetupBox() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">إعداد إدارة KYC</h2>
      <ol className="space-y-3 list-decimal pr-5 text-gray-700">
        <li>
          أضف متغير بيئة: <code>KYC_ADMIN_TOKEN</code> داخل Vercel.
        </li>
        <li>
          تأكد من وجود: <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </li>
        <li>
          شغّل ملف <code>supabase/dribads_schema.sql</code> بعد تحديث جدول <code>publisher_profiles</code>.
        </li>
      </ol>
    </div>
  );
}

function getParam(params, key, fallback = "") {
  const value = params?.[key];
  if (Array.isArray(value)) return String(value[0] || fallback);
  if (value == null) return fallback;
  return String(value);
}

function normalizeDateInput(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

function buildKycRedirectQuery({
  statusFilter = "all",
  auditUserId = "",
  auditActor = "",
  auditFrom = "",
  auditTo = "",
  ok = "",
  error = "",
}) {
  const query = new URLSearchParams();
  query.set("status", statusFilter);
  if (auditUserId) query.set("auditUserId", auditUserId);
  if (auditActor) query.set("auditActor", auditActor);
  if (auditFrom) query.set("auditFrom", auditFrom);
  if (auditTo) query.set("auditTo", auditTo);
  if (ok) query.set("ok", ok);
  if (error) query.set("error", error);
  return query.toString();
}

export default async function AdminKycPage({ searchParams }) {
  async function onUpdateKyc(formData) {
    "use server";

    const expectedToken = process.env.KYC_ADMIN_TOKEN || process.env.BLOG_ADMIN_TOKEN || "";
    const providedToken = String(formData.get("adminToken") || "");
    const statusFilter = String(formData.get("statusFilter") || "all");
    const auditUserId = String(formData.get("auditUserId") || "");
    const auditActor = String(formData.get("auditActor") || "");
    const auditFrom = normalizeDateInput(formData.get("auditFrom"));
    const auditTo = normalizeDateInput(formData.get("auditTo"));

    if (expectedToken && providedToken !== expectedToken) {
      const query = buildKycRedirectQuery({
        statusFilter,
        auditUserId,
        auditActor,
        auditFrom,
        auditTo,
        error: "unauthorized",
      });
      redirect(`/admin/kyc?${query}`);
    }

    const userId = String(formData.get("userId") || "");
    const nextStatus = String(formData.get("nextStatus") || "");
    const reason = String(formData.get("reason") || "").slice(0, 500);
    const actorLabel = String(formData.get("actorLabel") || "admin").slice(0, 120) || "admin";

    if (!userId || !VALID_STATUSES.includes(nextStatus)) {
      const query = buildKycRedirectQuery({
        statusFilter,
        auditUserId,
        auditActor,
        auditFrom,
        auditTo,
        error: "invalid",
      });
      redirect(`/admin/kyc?${query}`);
    }

    const admin = await getSupabaseAdminClient();
    if (!admin) {
      const query = buildKycRedirectQuery({
        statusFilter,
        auditUserId,
        auditActor,
        auditFrom,
        auditTo,
        error: "not_configured",
      });
      redirect(`/admin/kyc?${query}`);
    }

    const { data: currentProfile, error: currentProfileError } = await admin
      .schema("dribads")
      .from("publisher_profiles")
      .select("kyc_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (currentProfileError) {
      const query = buildKycRedirectQuery({
        statusFilter,
        auditUserId,
        auditActor,
        auditFrom,
        auditTo,
        error: currentProfileError.message || "read_failed",
      });
      redirect(`/admin/kyc?${query}`);
    }

    if (!currentProfile) {
      const query = buildKycRedirectQuery({
        statusFilter,
        auditUserId,
        auditActor,
        auditFrom,
        auditTo,
        error: "profile_not_found",
      });
      redirect(`/admin/kyc?${query}`);
    }

    const previousStatus = currentProfile.kyc_status;

    const { error } = await admin
      .schema("dribads")
      .from("publisher_profiles")
      .update({ kyc_status: nextStatus, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      const query = buildKycRedirectQuery({
        statusFilter,
        auditUserId,
        auditActor,
        auditFrom,
        auditTo,
        error: error.message || "update_failed",
      });
      redirect(`/admin/kyc?${query}`);
    }

    if (previousStatus !== nextStatus) {
      const { error: logError } = await admin.schema("dribads").from("kyc_audit_logs").insert({
        profile_user_id: userId,
        previous_status: previousStatus,
        new_status: nextStatus,
        reason,
        actor_label: actorLabel,
      });

      if (logError) {
        const query = buildKycRedirectQuery({
          statusFilter,
          auditUserId,
          auditActor,
          auditFrom,
          auditTo,
          error: logError.message || "audit_log_failed",
        });
        redirect(`/admin/kyc?${query}`);
      }
    }

    const query = buildKycRedirectQuery({
      statusFilter,
      auditUserId,
      auditActor,
      auditFrom,
      auditTo,
      ok: "1",
    });
    redirect(`/admin/kyc?${query}`);
  }

  const params = await Promise.resolve(searchParams || {});
  const supabaseReady = isSupabaseAdminConfigured();
  const selectedStatus = VALID_STATUSES.includes(getParam(params, "status", "all"))
    ? getParam(params, "status", "all")
    : "all";
  const requiresToken = Boolean(process.env.KYC_ADMIN_TOKEN || process.env.BLOG_ADMIN_TOKEN);
  const error = getParam(params, "error", "");
  const ok = getParam(params, "ok", "") === "1";
  const auditUserId = getParam(params, "auditUserId", "").trim();
  const auditActor = getParam(params, "auditActor", "").trim();
  const auditFrom = normalizeDateInput(getParam(params, "auditFrom", ""));
  const auditTo = normalizeDateInput(getParam(params, "auditTo", ""));

  let rows = [];
  let auditLogs = [];
  if (supabaseReady) {
    const admin = await getSupabaseAdminClient();
    const query = admin
      .schema("dribads")
      .from("publisher_profiles")
      .select(
        "user_id, full_name, country, company_name, payment_method, payout_email, publisher_type, kyc_status, updated_at, created_at"
      )
      .order("updated_at", { ascending: false })
      .limit(300);

    const { data } = await query;
    rows = data || [];
    if (selectedStatus !== "all") {
      rows = rows.filter((row) => row.kyc_status === selectedStatus);
    }

    let logsQuery = admin
      .schema("dribads")
      .from("kyc_audit_logs")
      .select("id, profile_user_id, previous_status, new_status, reason, actor_label, created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (auditUserId) {
      logsQuery = logsQuery.eq("profile_user_id", auditUserId);
    }
    if (auditActor) {
      logsQuery = logsQuery.ilike("actor_label", `%${auditActor}%`);
    }
    if (auditFrom) {
      logsQuery = logsQuery.gte("created_at", `${auditFrom}T00:00:00.000Z`);
    }
    if (auditTo) {
      logsQuery = logsQuery.lte("created_at", `${auditTo}T23:59:59.999Z`);
    }

    const { data: logsData } = await logsQuery;
    auditLogs = logsData || [];
  }

  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-sky-50 to-indigo-100 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">إدارة تحقق الناشرين KYC</h1>
              <p className="mt-3 text-lg text-gray-700">
                تحديث حالات التحقق باحترافية: pending / in_review / verified / rejected
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-lg font-semibold"
            >
              العودة للأدمن
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {!supabaseReady ? <SetupBox /> : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
              {error === "unauthorized" ? "رمز الإدارة غير صحيح." : `فشل التحديث: ${error}`}
            </div>
          ) : null}

          {ok ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              تم تحديث حالة KYC بنجاح.
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {["all", ...VALID_STATUSES].map((status) => {
                const active = status === selectedStatus;
                const label = status === "all" ? "كل الحالات" : STATUS_LABELS[status];
                const query = buildKycRedirectQuery({
                  statusFilter: status,
                  auditUserId,
                  auditActor,
                  auditFrom,
                  auditTo,
                });
                return (
                  <Link
                    key={status}
                    href={`/admin/kyc?${query}`}
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold border ${
                      active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[1350px] border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">الناشر</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">معرف المستخدم</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">الدولة</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">الشركة</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">وسيلة الدفع</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">بريد الدفعات</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">الحالة الحالية</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">سبب التغيير</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">المسؤول</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">تحديث</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.user_id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.full_name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{row.user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.country || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.company_name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.payment_method || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.payout_email || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                          row.kyc_status
                        )}`}
                      >
                        {STATUS_LABELS[row.kyc_status] || row.kyc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        name="reason"
                        form={`kyc-form-${row.user_id}`}
                        placeholder="سبب التحديث (اختياري)"
                        className="w-52 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        name="actorLabel"
                        form={`kyc-form-${row.user_id}`}
                        placeholder="اسم المسؤول"
                        className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <form id={`kyc-form-${row.user_id}`} action={onUpdateKyc} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={row.user_id} />
                        <input type="hidden" name="statusFilter" value={selectedStatus} />
                        <input type="hidden" name="auditUserId" value={auditUserId} />
                        <input type="hidden" name="auditActor" value={auditActor} />
                        <input type="hidden" name="auditFrom" value={auditFrom} />
                        <input type="hidden" name="auditTo" value={auditTo} />
                        {requiresToken ? (
                          <input
                            type="password"
                            name="adminToken"
                            required
                            placeholder="KYC_ADMIN_TOKEN"
                            className="w-44 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          />
                        ) : (
                          <input type="hidden" name="adminToken" value="" />
                        )}
                        <select
                          name="nextStatus"
                          defaultValue={row.kyc_status}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                          {VALID_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          حفظ
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      لا توجد سجلات KYC مطابقة.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-gray-200 overflow-x-auto">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 font-bold text-gray-800">
              سجل تدقيق KYC (آخر العمليات)
            </div>

            <div className="p-4 border-b border-gray-100">
              <form method="get" action="/admin/kyc" className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input type="hidden" name="status" value={selectedStatus} />
                <input
                  type="text"
                  name="auditUserId"
                  defaultValue={auditUserId}
                  placeholder="فلترة بمعرف المستخدم"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  name="auditActor"
                  defaultValue={auditActor}
                  placeholder="فلترة باسم المسؤول"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  name="auditFrom"
                  defaultValue={auditFrom}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  name="auditTo"
                  defaultValue={auditTo}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    تطبيق الفلاتر
                  </button>
                  <Link
                    href={`/admin/kyc?status=${encodeURIComponent(selectedStatus)}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    إعادة تعيين
                  </Link>
                </div>
              </form>

              <form method="get" action="/api/admin/kyc-audit/csv" className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="status" value={selectedStatus} />
                <input type="hidden" name="auditUserId" value={auditUserId} />
                <input type="hidden" name="auditActor" value={auditActor} />
                <input type="hidden" name="auditFrom" value={auditFrom} />
                <input type="hidden" name="auditTo" value={auditTo} />
                {requiresToken ? (
                  <input
                    type="password"
                    name="adminToken"
                    placeholder="KYC_ADMIN_TOKEN"
                    required
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                ) : null}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  تصدير CSV
                </button>
              </form>
            </div>

            <table className="w-full min-w-[980px] border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">الوقت</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">معرف المستخدم</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">من</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">إلى</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">السبب</th>
                  <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">المسؤول</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleString("ar-MA")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.profile_user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {STATUS_LABELS[log.previous_status] || log.previous_status}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {STATUS_LABELS[log.new_status] || log.new_status}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.reason || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.actor_label || "-"}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      لا توجد عمليات تدقيق بعد.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
