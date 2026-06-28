export const isToday = (timestampOrDateStr, isTimestamp = false) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = isTimestamp 
    ? new Date(Number(timestampOrDateStr))
    : new Date(timestampOrDateStr)
    
  target.setHours(0, 0, 0, 0)
  return target.getTime() === today.getTime()
}
