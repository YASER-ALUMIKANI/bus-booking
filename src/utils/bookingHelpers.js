export const handleExcelDownload = (filteredBookings) => {
  const headers = ['معرّف','المسافر','الهاتف','الجواز','من','إلى','تاريخ السفر','الحالة','رقم الحوالة','الحالة المطلوبة','سبب الإلغاء','سبب طلب الإلغاء','مقفول','طلب تغيير','موافقة','ضيف','الطابع الزمني']
  const rows = filteredBookings.map((b) => [
    b.id, b.passenger_name, b.phone, b.passport,
    b.origin, b.destination, b.travel_date, b.status,
    b.payment_ref || '', b.requested_status || '',
    b.cancellation_reason || '',
    b.requested_cancellation_reason || '',
    b.locked ? 'نعم' : 'لا',
    b.change_requested ? 'نعم' : 'لا',
    b.approval_granted ? 'نعم' : 'لا',
    b.guest ? 'نعم' : 'لا',
    b.timestamp,
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const handlePrintManifest = (filteredBookings) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const grouped = {};
  filteredBookings.forEach(b => {
    const d = b.travel_date || 'غير محدد';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(b);
  });

  const sortedDates = Object.keys(grouped).sort();

  let contentHtml = '';
  sortedDates.forEach((date, dateIdx) => {
    const dateBookings = grouped[date];
    const tableRows = dateBookings.map((b, idx) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; text-align: right;">${b.passenger_name}</td>
        <td style="padding: 10px; text-align: center;">${b.phone}</td>
        <td style="padding: 10px; text-align: center;">${b.passport}</td>
        <td style="padding: 10px; text-align: center; font-weight: bold;">${b.seat || '-'}</td>
        <td style="padding: 10px; text-align: center;">${b.travel_date}</td>
        <td style="padding: 10px; text-align: center;">${b.company}</td>
        <td style="padding: 10px; text-align: right;">${b.origin} ← ${b.destination}</td>
        <td style="padding: 10px; text-align: center;">${b.payment_ref || '-'}</td>
        <td style="padding: 10px; text-align: center;">${b.status === 'confirmed' ? 'مؤكد' : b.status === 'pending' ? 'معلق' : 'ملغي'}</td>
      </tr>
    `).join('');

    const pageBreak = dateIdx < sortedDates.length - 1 ? 'page-break-after: always;' : '';

    contentHtml += `
      <div style="${pageBreak} padding-bottom: 20px;">
        <h1 style="text-align: center; font-size: 24px; margin-bottom: 5px;">كشف ركاب الرحلة (البيان)</h1>
        <div class="meta-info" style="text-align: center; font-size: 14px; color: #666; margin-bottom: 25px;">
          تاريخ الرحلة: ${date} | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')} | عدد الركاب: ${dateBookings.length}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ccc;">
              <th style="padding: 12px; font-weight: bold; text-align: center;">#</th>
              <th style="padding: 12px; font-weight: bold; text-align: right;">المسافر</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">الهاتف</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">الجواز</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">المقعد</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">التاريخ</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">الشركة</th>
              <th style="padding: 12px; font-weight: bold; text-align: right;">المسار</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">رقم الحوالة</th>
              <th style="padding: 12px; font-weight: bold; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  });

  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>كشف ركاب الرحلة (البيان)</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: left; margin-bottom: 15px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background-color: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">طباعة الكشف</button>
        </div>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}
