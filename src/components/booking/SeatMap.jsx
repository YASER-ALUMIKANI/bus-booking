import React from 'react'

export const SeatMap = ({
  selectedSchedule,
  bookedSeats,
  selectedSeats,
  handleSeatClick
}) => {
  if (!selectedSchedule) return null
  const total = selectedSchedule.totalSeats || 40
  const isVip = selectedSchedule.busType === 'VIP'
  const seats = []
  
  if (isVip) {
    for (let i = 1; i <= total; i += 3) {
      const rowSeats = []
      for (let j = 0; j < 3; j++) {
        if (i + j <= total) {
          rowSeats.push(i + j)
        } else {
          rowSeats.push(null)
        }
      }
      seats.push(rowSeats)
    }
  } else {
    for (let i = 1; i <= total; i += 4) {
      const rowSeats = []
      for (let j = 0; j < 4; j++) {
        if (i + j <= total) {
          rowSeats.push(i + j)
        } else {
          rowSeats.push(null)
        }
      }
      seats.push(rowSeats)
    }
  }

  const renderSeatButton = (seatNum) => {
    const isBooked = bookedSeats.includes(seatNum)
    const isSelected = selectedSeats.includes(seatNum)
    
    let btnClasses = "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all "
    if (isBooked) {
      btnClasses += "bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-400 cursor-not-allowed"
    } else if (isSelected) {
      btnClasses += "bg-violet-600 text-white shadow-lg shadow-violet-200/50 dark:shadow-violet-900/50 ring-2 ring-violet-400 scale-105"
    } else {
      btnClasses += "bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-violet-500 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer"
    }
    
    return (
      <button
        key={seatNum}
        type="button"
        disabled={isBooked}
        onClick={() => handleSeatClick(seatNum)}
        className={btnClasses}
        title={isBooked ? `المقعد ${seatNum} محجوز` : `المقعد ${seatNum}`}
      >
        {seatNum}
      </button>
    )
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50 dark:bg-neutral-950 mt-4 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 font-sans">
          اختر رقم المقعد ({isVip ? 'حافلة VIP' : 'حافلة عادية'})
        </h4>
        <div className="flex gap-4 text-xs font-sans">
          <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 inline-block"></span> متاح</span>
          <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-violet-600 inline-block"></span> محدد</span>
          <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900 inline-block"></span> محجوز</span>
        </div>
      </div>
      
      {/* Bus Front Indicator */}
      <div className="w-full flex justify-center mb-6">
        <div className="w-24 py-1 text-center bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-500 rounded-t-xl border-t border-x border-neutral-300 dark:border-neutral-700 relative">
          مقدمة الحافلة (السائق)
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-t-sm"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto">
        {seats.map((row, rIdx) => {
          if (isVip) {
            return (
              <React.Fragment key={rIdx}>
                {/* Column 1: Right Seat */}
                {row[0] !== null ? renderSeatButton(row[0]) : <div />}
                
                {/* Column 2: Empty Spacer */}
                <div />
                
                {/* Column 3: The Aisle Spacer */}
                <div className="flex items-center justify-center text-[10px] text-neutral-400 dark:text-neutral-600 font-bold select-none">
                  ممر
                </div>
                
                {/* Column 4: Left Aisle Seat */}
                {row[1] !== null ? renderSeatButton(row[1]) : <div />}
                
                {/* Column 5: Left Window Seat */}
                {row[2] !== null ? renderSeatButton(row[2]) : <div />}
              </React.Fragment>
            )
          } else {
            return (
              <React.Fragment key={rIdx}>
                {/* Column 1: Window Right */}
                {row[0] !== null ? renderSeatButton(row[0]) : <div />}
                
                {/* Column 2: Aisle Right */}
                {row[1] !== null ? renderSeatButton(row[1]) : <div />}
                
                {/* Column 3: The Aisle Spacer */}
                <div className="flex items-center justify-center text-[10px] text-neutral-400 dark:text-neutral-600 font-bold select-none">
                  ممر
                </div>
                
                {/* Column 4: Aisle Left */}
                {row[2] !== null ? renderSeatButton(row[2]) : <div />}
                
                {/* Column 5: Window Left */}
                {row[3] !== null ? renderSeatButton(row[3]) : <div />}
              </React.Fragment>
            )
          }
        })}
      </div>
    </div>
  )
}

export default SeatMap
