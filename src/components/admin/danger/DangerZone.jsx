import React from 'react'

const DangerZone = ({
  handleClearDatabase,
  handleClearClients,
  adminUsers,
  handleDeleteAdmin
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-3xl font-black mb-2 font-sans">منطقة الإجراءات الحساسة (Dangerous Zone)</h2>
        <p className="text-red-100 max-w-2xl text-sm leading-6">
          تحذير: تحتوي هذه الصفحة على عمليات تصفية وحذف لبيانات النظام وقاعدة البيانات بالكامل. لا تنفذ أي إجراء إلا إذا كنت متأكداً تماماً مما تفعله.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Database Cleanup Panel */}
        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-950/40 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-red-50 dark:bg-red-950/20 px-6 py-4 border-b border-red-100 dark:border-red-950/30 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">تصفية قاعدة البيانات (Clear DB)</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500 leading-5">
              هذا الإجراء سيقوم بمسح كافة الحجوزات المسجلة والرحلات الزمنية المضافة. سيتم تصفية الجداول بالكامل لتصبح فارغة تماماً.
            </p>
            <button
              onClick={handleClearDatabase}
              className="w-full bg-red-650 hover:bg-red-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow-sm"
            >
              تصفية الحجوزات والرحلات نهائياً
            </button>
          </div>
        </div>

        {/* Clients Cleanup Panel */}
        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-950/40 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-red-50 dark:bg-red-950/20 px-6 py-4 border-b border-red-100 dark:border-red-950/30 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">تصفية حسابات المشتركين (Delete Clients)</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500 leading-5">
              سيقوم هذا الإجراء بحذف جميع حسابات العملاء المسجلين، بالإضافة إلى إتلاف كافة طلبات التوثيق والهويات وحجوزات السفر الخاصة بهم.
            </p>
            <button
              onClick={handleClearClients}
              className="w-full bg-red-650 hover:bg-red-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow-sm"
            >
              مسح وحذف كافة حسابات المشتركين
            </button>
          </div>
        </div>

      </div>

      {/* Admin Deletion Panel */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">إدارة وإلغاء حسابات المشرفين (Manage Admins)</h3>
        </div>
        <div className="p-6">
          {adminUsers.length === 0 ? (
            <p className="text-xs text-slate-500">لا يوجد مشرفين آخرين حالياً.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs leading-5" dir="rtl">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-800 text-slate-400 font-bold">
                    <th className="p-3">اسم المستخدم</th>
                    <th className="p-3">صلاحيات الحساب</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user) => (
                    <tr key={user.username} className="border-b border-slate-50 dark:border-neutral-850 hover:bg-slate-50/50 dark:hover:bg-neutral-950/20">
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{user.username}</td>
                      <td className="p-3">
                        {user.role === 'manager' ? (
                          <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">مدير نظام</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">موظف</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {user.username === localStorage.getItem('adminUsername') ? (
                          <span className="text-slate-400 font-bold">الحساب الحالي</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAdmin(user.username)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-lg font-bold transition"
                          >
                            حذف وإلغاء الصلاحية
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(DangerZone)
