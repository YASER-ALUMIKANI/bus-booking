import React from 'react'

const UserManager = ({
  adminUsers,
  newUser,
  setNewUser,
  userMessage,
  userError,
  creatingUser,
  handleCreateUser
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* User Creation Form */}
      <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-orange-600">إدارة الأمن والمشرفين</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">إنشاء حساب مسؤول جديد</h2>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-660 dark:text-slate-400">اسم المستخدم</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950"
              placeholder="مثال: admin_ali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-660 dark:text-slate-400">كلمة المرور</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950"
              placeholder="كلمة المرور"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-660 dark:text-slate-400">الدور الصلاحي</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950"
            >
              <option value="employee">موظف (موافق حجوزات)</option>
              <option value="manager">مدير الموقع (صلاحيات كاملة)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={creatingUser}
              className="mt-4 w-full rounded-full bg-orange-600 px-8 py-3 text-white font-semibold hover:bg-orange-700 transition"
            >
              {creatingUser ? 'جارٍ إنشاء المستخدم...' : 'إنشاء مستخدم جديد'}
            </button>
          </div>
        </form>

        {userError && <p className="text-sm text-red-650 mt-2">{userError}</p>}
        {userMessage && <p className="text-sm text-green-650 mt-2">{userMessage}</p>}
      </div>

      {/* Active Admins List Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-4">المشرفون المسجلون حالياً</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-neutral-800 text-sm">
            <thead className="bg-slate-100 dark:bg-neutral-800/60">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">اسم المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">الدور الصلاحي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-slate-400">لا يوجد مشرفين آخرين</td>
                </tr>
              ) : adminUsers.map((u, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50/50 dark:bg-neutral-950/20'}>
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-semibold">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                      u.role === 'manager'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                    }`}>
                      {u.role === 'manager' ? 'مدير كامل الصلاحية' : 'موظف موافق تذاكر'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default React.memo(UserManager)
