export const openPrintWindow = (ticket) => {
  if (typeof window === 'undefined') return
  const printWindow = window.open('', '_blank', 'width=950,height=750')
  if (!printWindow) return

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const safeTicketNumber = escapeHtml(ticket.ticketNumber)
  const safeCompany = escapeHtml(ticket.company)
  const safePassengerName = escapeHtml(ticket.passengerName)
  const safePhone = escapeHtml(ticket.phone)
  const safePassport = escapeHtml(ticket.passport)
  const safeTravelDate = escapeHtml(ticket.travelDate)
  const safeOrigin = escapeHtml(ticket.origin)
  const safeDestination = escapeHtml(ticket.destination)
  const safeSeat = escapeHtml(ticket.seat)
  const safeDob = escapeHtml(ticket.dob)
  const safeTripTime = escapeHtml(ticket.tripTime)
  const safeArrivalTime = escapeHtml(ticket.arrivalTime)
  const safeDayOfWeek = escapeHtml(ticket.dayOfWeek)
  const safeIssuingOffice = escapeHtml(ticket.issuingOffice)
  const safePrice = escapeHtml(ticket.price)
  const safeNotes = escapeHtml(ticket.notes)
  const safeBusType = escapeHtml(ticket.busType)

  const html = `
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>طباعة التذكرة</title>
      <style>
        body { margin: 0; padding: 10px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; direction: rtl; background: #fff; color: #000; }
        .print-header { display: flex; justify-content: flex-end; margin-bottom: 15px; }
        .print-button { padding: 0.8rem 1.8rem; background: #7c3aed; border: none; border-radius: 9999px; color: white; font-size: 1rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .print-button:hover { background: #6d28d9; }
        @media print { .print-header { display: none; } body { padding: 0; } }
        
        .ticket-wrapper {
          display: flex;
          border: 2px solid #000;
          width: 100%;
          max-width: 900px;
          margin: auto;
          box-sizing: border-box;
        }
        
        .ticket-side {
          width: 170px;
          border-left: 2px solid #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 15px 10px;
          box-sizing: border-box;
          background: #fff;
        }
        
        .logo-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
        }
        
        .qr-code {
          margin-top: 20px;
        }
        .qr-code img {
          width: 110px;
          height: 110px;
          display: block;
        }
        
        .ticket-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        
        .ticket-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .ticket-table td {
          border-bottom: 1px solid #000;
          border-left: 1px solid #000;
          padding: 8px 10px;
          font-size: 13px;
          vertical-align: middle;
          box-sizing: border-box;
        }
        
        .ticket-table td:last-child {
          border-left: none;
        }
        
        .lbl-col {
          background: #f8fafc;
          font-weight: bold;
          text-align: center;
          width: 95px;
          font-size: 12px;
        }
        
        .val-col {
          text-align: right;
          font-weight: 600;
          font-size: 14px;
        }
        
        .val-col-highlight {
          font-weight: bold;
          font-size: 15px;
        }
        
        .rules-section {
          padding: 10px 15px;
          font-size: 10.5px;
          line-height: 1.5;
          color: #000;
          font-weight: 600;
          border-top: 1px solid #000;
        }
        
        .rules-text {
          margin-bottom: 6px;
        }
        
        .contacts-footer {
          margin-top: 10px;
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          border-top: 1.5px dashed #000;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <button class="print-button" onclick="window.print()">طباعة التذكرة</button>
      </div>
      
      <div class="ticket-wrapper">
        <div class="ticket-side">
          <div class="logo-badge" style="margin-bottom: 20px;">
            <img src="/logo.png" alt="Yemen Bus" style="max-width: 130px; height: auto; display: block; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
          </div>
          
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${safeTicketNumber}" alt="QR" />
          </div>
        </div>
        
        <div class="ticket-main">
          <table class="ticket-table">
            <tr>
              <td class="lbl-col" style="width: 15%;">رقم التذكرة</td>
              <td class="val-col val-col-highlight" style="width: 45%; font-size: 16px;">${safeTicketNumber}</td>
              <td class="lbl-col" style="width: 15%;">رقم الجواز</td>
              <td class="val-col" style="width: 25%;">${safePassport}</td>
            </tr>
            <tr>
              <td class="lbl-col">الاسم</td>
              <td class="val-col" style="font-size: 15px;">${safePassengerName}</td>
              <td class="lbl-col">الرحلة</td>
              <td class="val-col">${safeOrigin} - ${safeDestination}</td>
            </tr>
            <tr>
              <td class="lbl-col">العمر/تاريخ الميلاد</td>
              <td class="val-col">
                <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
                  <tr>
                    <td style="border: none; padding: 0; text-align: right; font-weight: bold; font-size: 15px;">${safeDob}</td>
                    <td class="lbl-col" style="border: none; padding: 0 5px; background: transparent; width: auto; font-weight: bold;">المقعد</td>
                    <td style="border: none; padding: 0; text-align: right; font-weight: bold; font-size: 16px; color: #dc2626;">${safeSeat}</td>
                  </tr>
                </table>
              </td>
              <td class="lbl-col">تاريخ الرحلة</td>
              <td class="val-col">
                <span>${safeTravelDate}</span>
                <span style="margin: 0 8px; font-weight: normal; color: #4b5563;">|</span>
                <span style="color: #dc2626;">${safeTripTime}</span>
              </td>
            </tr>
            <tr>
              <td class="lbl-col">الإصدار</td>
              <td class="val-col" style="font-size: 12px; font-weight: normal;">${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</td>
              <td class="lbl-col">وقت الحضور</td>
              <td class="val-col">${safeArrivalTime}</td>
            </tr>
            <tr>
              <td class="lbl-col">مكتب الاصدار</td>
              <td class="val-col" style="font-size: 13px;">${safeCompany} | ${safeBusType} | ${safeIssuingOffice}</td>
              <td class="lbl-col">اليوم</td>
              <td class="val-col">${safeDayOfWeek}</td>
            </tr>
            <tr>
              <td class="lbl-col">ملاحظات</td>
              <td class="val-col" style="font-size: 13px;">${safeNotes}</td>
              <td class="lbl-col">السعر</td>
              <td class="val-col val-col-highlight" style="color: #dc2626; font-size: 17px;">${safePrice}</td>
            </tr>
          </table>
          
          <div class="rules-section">
            <div class="rules-text">
              - في حالة إلغاء التذكرة أو التخلف عن السفر تخصم كامل قيمة التذكرة مهما كانت الأسباب - إذا أردت تأجيل السفر يعلم المكتب قبل 12 ساعة من تاريخ السفر وتخصم 30%.
            </div>
            <div class="rules-text">
              - الوزن المسموح للراكب المقيم 60 كيلو فقط والمعتمر 30 كيلو فقط. على المسافر متابعة عفشه عند التحميل وعند التنزيل والشركة غير مسؤولة عن الأمتعة التي بصحبة الراكب. كل من يتأخر عن موعد السفر فالمكتب غير مسؤول عنه ولا عن تعويضه.
            </div>
            
            <div class="contacts-footer">
              للتواصل: 01/606330 و 01/636998 و 01/284040
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
}
