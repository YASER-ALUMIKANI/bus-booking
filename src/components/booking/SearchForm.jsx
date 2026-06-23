import React from 'react'
import DatePicker from '../DatePicker/DatePicker'
import { cityOptions } from '../../constants/cities'

export const SearchForm = ({
  searchOrigin,
  setSearchOrigin,
  searchDestination,
  setSearchDestination,
  searchAdults,
  setSearchAdults,
  searchChildren,
  setSearchChildren,
  searchDate,
  setSearchDate,
  availableDates,
  searching,
  handleSearch
}) => {
  return (
    <form onSubmit={handleSearch} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-md space-y-6">
      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 border-b border-neutral-100 dark:border-neutral-800 pb-3 font-sans">البحث عن رحلة</h3>
      
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">من (مدينة المغادرة)</label>
          <select
            value={searchOrigin}
            onChange={(e) => setSearchOrigin(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 font-semibold"
          >
            <option value="">اختر مدينة المغادرة</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">إلى (مدينة الوصول)</label>
          <select
            value={searchDestination}
            onChange={(e) => setSearchDestination(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 font-semibold"
          >
            <option value="">اختر مدينة الوصول</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Passengers Selection Box */}
      <div className="border border-neutral-200 dark:border-neutral-850 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-950/40 space-y-4">
        <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">عدد الركاب (Passengers)</span>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center justify-between flex-1 border-l sm:border-l border-neutral-200 dark:border-neutral-800 pl-4">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">البالغين (Adults)</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSearchAdults(Math.max(1, searchAdults - 1))}
                className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >-</button>
              <span className="font-extrabold text-base w-5 text-center">{searchAdults}</span>
              <button
                type="button"
                onClick={() => setSearchAdults(searchAdults + 1)}
                className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >+</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between flex-1 pr-0 sm:pr-4">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">الأطفال (Children)</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSearchChildren(Math.max(0, searchChildren - 1))}
                className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >-</button>
              <span className="font-extrabold text-base w-5 text-center">{searchChildren}</span>
              <button
                type="button"
                onClick={() => setSearchChildren(searchChildren + 1)}
                className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection Box using DatePicker */}
      <div>
        <label className="block text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">تاريخ الرحلة</label>
        {availableDates.length === 0 ? (
          <div className="text-sm text-neutral-500">لا توجد رحلات مُجدولة حالياً.</div>
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3">
            <DatePicker 
              availableDates={availableDates} 
              value={searchDate} 
              onChange={(date) => setSearchDate(date)} 
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={searching}
        className="w-full rounded-2xl bg-[#c39c40] hover:bg-[#b08c35] text-white py-4 text-base font-bold shadow-lg transition disabled:opacity-50"
      >
        {searching ? 'جاري البحث...' : 'بحث عن الرحلات'}
      </button>
    </form>
  )
}

export default SearchForm
