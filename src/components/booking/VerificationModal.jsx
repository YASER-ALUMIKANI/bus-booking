import React from 'react'

export const VerificationModal = ({
  verifyFullname,
  setVerifyFullname,
  verifyIdType,
  setVerifyIdType,
  verifyIdNumber,
  setVerifyIdNumber,
  verifyIssueDate,
  setVerifyIssueDate,
  verifyIssuePlace,
  setVerifyIssuePlace,
  verifyImagePreview,
  setVerifyImagePreview,
  setVerifyImage,
  verifyError,
  verifySuccess,
  verifyLoading,
  handleVerifySubmit,
  onClose
}) => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-lg mx-auto bg-neutral-50 dark:bg-neutral-950 p-4 rounded-3xl" dir="rtl">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-3xl shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm transition font-bold cursor-pointer"
          title="رجوع"
        >
          ➔
        </button>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 font-sans">تأكيد الحساب</h2>
        <div className="w-10" /> {/* Spacer to align title */}
      </div>

      {verifyError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 font-sans">
          {verifyError}
        </div>
      )}

      {verifySuccess && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-950 dark:bg-green-950/20 dark:text-green-400 font-sans">
          {verifySuccess}
        </div>
      )}

      <form onSubmit={handleVerifySubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-md space-y-6">
        
        {/* Full Name */}
        <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30">
          <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={verifyFullname}
            onChange={(e) => setVerifyFullname(e.target.value)}
            required
            placeholder="ياسر الحميّقاني"
            className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold font-sans"
          />
        </div>

        {/* Identity details (Grid) */}
        <div className="grid gap-5 grid-cols-2">
          
          {/* Identity Number */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-2">
            <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans">
              رقم الهوية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={verifyIdNumber}
              onChange={(e) => setVerifyIdNumber(e.target.value)}
              required
              placeholder="12356323"
              className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold font-sans"
            />
          </div>

          {/* Identity Type */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-1">
            <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-450 dark:text-neutral-500 font-sans">
              الهوية
            </label>
            <select
              value={verifyIdType}
              onChange={(e) => setVerifyIdType(e.target.value)}
              className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold appearance-none font-sans"
            >
              <option value="جواز سفر">جواز سفر</option>
              <option value="بطاقة شخصية">بطاقة شخصية</option>
            </select>
          </div>
          
        </div>

        {/* Issue place and date (Grid) */}
        <div className="grid gap-5 grid-cols-2">
          
          {/* Date of Issue */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-2">
            <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans">
              تاريخ الإصدار <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={verifyIssueDate}
              onChange={(e) => setVerifyIssueDate(e.target.value)}
              required
              placeholder="23/06/2026"
              className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold font-sans"
            />
          </div>

          {/* Place of Issue */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2 bg-neutral-50 dark:bg-neutral-950/30 order-1">
            <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-450 dark:text-neutral-500 font-sans">
              مكان الإصدار <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={verifyIssuePlace}
              onChange={(e) => setVerifyIssuePlace(e.target.value)}
              required
              placeholder="عدن"
              className="w-full bg-transparent px-1 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none font-semibold font-sans"
            />
          </div>

        </div>

        {/* Front Side Image Upload */}
        <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-950/30">
          <label className="absolute -top-2.5 right-3 bg-white dark:bg-neutral-900 px-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans">
            صورة الجهة الأمامية للهوية
          </label>
          <div className="flex flex-col items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 bg-[#eaeaea] dark:bg-neutral-900/60 hover:border-violet-500 transition cursor-pointer relative min-h-[160px]">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setVerifyImage(file)
                  setVerifyImagePreview(URL.createObjectURL(file))
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {verifyImagePreview ? (
              <img
                src={verifyImagePreview}
                alt="معاينة الهوية"
                className="max-h-36 w-full object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center text-center space-y-2 text-neutral-400">
                <svg className="w-12 h-12 text-[#c39c40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-semibold text-neutral-500 font-sans">اضغط لرفع الصورة من المعرض أو الكاميرا</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={verifyLoading}
          className="w-full rounded-2xl bg-[#c39c40] hover:bg-[#b08c35] text-white py-4 text-base font-bold shadow-lg transition disabled:opacity-50 cursor-pointer font-sans"
        >
          {verifyLoading ? 'جاري الإرسال...' : 'Confirm Account'}
        </button>

      </form>
    </div>
  )
}

export default VerificationModal
