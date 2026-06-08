import React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, parseISO } from 'date-fns'

// props: availableDates: array of strings or objects {id, travelDate}
// value: string date selected (ISO yyyy-mm-dd)
// onChange: function(dateString)
const DatePicker = ({ availableDates = [], value, onChange }) => {
  // convert availableDates to Date objects
  const available = availableDates.map((d) => {
    const s = d && (d.travelDate || d)
    try {
      return parseISO(s)
    } catch (e) {
      return null
    }
  }).filter(Boolean)

  const disabled = (date) => {
    // enable only dates that are in available
    return !available.some((d) => d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate())
  }

  let selected
  try {
    selected = value ? parseISO(value) : undefined
  } catch {
    selected = undefined
  }

  return (
    <div>
      <DayPicker
        mode="single"
        selected={selected}
        onDayClick={(d) => {
          if (!d) return
          const iso = format(d, 'yyyy-MM-dd')
          onChange && onChange(iso)
        }}
        disabled={disabled}
        modifiers={{ available: available }}
        modifiersClassNames={{ available: 'rdp-available' }}
        styles={{
          caption: { textAlign: 'center' },
        }}
      />
      <style>{`
        .rdp-available { background-color: #7c3aed; color: white; border-radius: 0.85rem; }
        .rdp-day_selected:not(.rdp-day_disabled) { background-color: #1d4ed8 !important; color: white !important; border-radius: 0.85rem; }
        .rdp-months { direction: rtl; }
      `}</style>
    </div>
  )
}

export default DatePicker
