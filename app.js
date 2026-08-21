document.addEventListener('DOMContentLoaded', () => {
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonthIndex = currentDate.getMonth();

  let savedPhone = localStorage.getItem('whatsapp_phone') || '525520368917';

  // Referencias DOM
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  const weekFilterSelect = document.getElementById('weekFilterSelect');
  const tableBody = document.getElementById('tableBody');
  const totalMonthEl = document.getElementById('totalMonth');
  const expectedCashEl = document.getElementById('expectedCash');
  const expectedBankEl = document.getElementById('expectedBank');
  const totalExpensesEl = document.getElementById('totalExpenses');
  const totalYearEl = document.getElementById('totalYear');
  const avgDailyEl = document.getElementById('avgDaily');
  const activeDaysEl = document.getElementById('activeDays');
  const monthTitleEl = document.getElementById('monthTitle');
  const printHeaderTitle = document.getElementById('printHeaderTitle');
  const printTotalMonth = document.getElementById('printTotalMonth');
  const printActiveDays = document.getElementById('printActiveDays');

  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const printBtn = document.getElementById('printBtn');
  const annualSurveyBtn = document.getElementById('annualSurveyBtn');
  const billCounterBtn = document.getElementById('billCounterBtn');
  const closeDayWhatsAppBtn = document.getElementById('closeDayWhatsAppBtn');
  const closeWeekWhatsAppBtn = document.getElementById('closeWeekWhatsAppBtn');
  const closeMonthWhatsAppBtn = document.getElementById('closeMonthWhatsAppBtn');

  // Modal Contador de Billetes DOM
  const billCounterModal = document.getElementById('billCounterModal');
  const initialCashInput = document.getElementById('initialCashInput');
  const systemExpectedCashInput = document.getElementById('systemExpectedCashInput');
  const coinsInput = document.getElementById('coinsInput');
  const physicalTotalDisplay = document.getElementById('physicalTotalDisplay');
  const cashDifferenceDisplay = document.getElementById('cashDifferenceDisplay');
  const closeBillCounterModalBtn = document.getElementById('closeBillCounterModalBtn');
  const applyCashToDayBtn = document.getElementById('applyCashToDayBtn');

  // Modal Sondeo Anual DOM
  const annualModal = document.getElementById('annualModal');
  const annualModalTitle = document.getElementById('annualModalTitle');
  const annualGrandTotal = document.getElementById('annualGrandTotal');
  const annualBreakdownBody = document.getElementById('annualBreakdownBody');
  const closeAnnualModalBtn = document.getElementById('closeAnnualModalBtn');

  // Modal DOM
  const whatsappModal = document.getElementById('whatsappModal');
  const phoneInput = document.getElementById('phoneInput');
  const weekSelectGroup = document.getElementById('weekSelectGroup');
  const weekSelect = document.getElementById('weekSelect');
  const whatsappPreview = document.getElementById('whatsappPreview');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const sendWhatsAppModalBtn = document.getElementById('sendWhatsAppModalBtn');

  function initSelectors() {
    for (let y = currentYear - 1; y <= currentYear + 2; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }

    monthNames.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = m;
      if (idx === currentMonthIndex) opt.selected = true;
      monthSelect.appendChild(opt);
    });

    monthSelect.addEventListener('change', () => {
      currentMonthIndex = parseInt(monthSelect.value);
      updateWeekFilterOptions();
      renderTable();
    });

    yearSelect.addEventListener('change', () => {
      currentYear = parseInt(yearSelect.value);
      updateWeekFilterOptions();
      renderTable();
    });

    if (weekFilterSelect) {
      weekFilterSelect.addEventListener('change', () => {
        renderTable();
      });
    }

    updateWeekFilterOptions();
  }

  function updateWeekFilterOptions() {
    if (!weekFilterSelect) return;
    const weeks = getWeeksOfMonth(currentYear, currentMonthIndex);
    weekFilterSelect.innerHTML = '<option value="all">Ver Todas las Semanas</option>';
    weeks.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      const firstDay = w.days[0].dayNum;
      const lastDay = w.days[w.days.length - 1].dayNum;
      opt.textContent = `Semana ${w.weekNum} (${firstDay} al ${lastDay})`;
      weekFilterSelect.appendChild(opt);
    });
  }

  // --- CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE ---
  const firebaseConfig = {
    apiKey: "AIzaSyAwRX0l27OJST7HknLDLR8qnvuV07zkSyo",
    authDomain: "registroromita.firebaseapp.com",
    databaseURL: "https://registroromita-default-rtdb.firebaseio.com",
    projectId: "registroromita",
    storageBucket: "registroromita.firebasestorage.app",
    messagingSenderId: "748531675406",
    appId: "1:748531675406:web:367aa7c77756e04676e75f",
    measurementId: "G-SJSTD4QWTX"
  };

  let db = null;
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();

    // Migrar automáticamente datos guardados previamente en esta PC a Firebase
    const localKeys = Object.keys(localStorage);
    localKeys.forEach(k => {
      if (k.startsWith('ganancias_v2_') || k.startsWith('papel_') || k.startsWith('bill_')) {
        try {
          const val = JSON.parse(localStorage.getItem(k));
          db.ref(`ganancias/${k}`).set(val);
        } catch(e) {
          const val = localStorage.getItem(k);
          db.ref(`ganancias/${k}`).set(val);
        }
      }
    });

    // Escuchar cambios globales en tiempo real desde cualquier dispositivo (PC / Celular)
    db.ref("ganancias").on("value", (snapshot) => {
      const allData = snapshot.val();
      if (allData) {
        Object.keys(allData).forEach(key => {
          const itemVal = allData[key];
          if (typeof itemVal === 'object') {
            localStorage.setItem(key, JSON.stringify(itemVal));
          } else {
            localStorage.setItem(key, itemVal);
          }
        });
        if (typeof renderTable === 'function') {
          renderTable();
        }
        if (typeof restorePaperInput === 'function') {
          restorePaperInput();
        }
        if (typeof restoreBillInputs === 'function') {
          restoreBillInputs();
        }
      }
    });
  }

  function getStorageKey(year, month) {
    return `ganancias_v2_${year}_${month}`;
  }

  function loadMonthData(year, month) {
    const raw = localStorage.getItem(getStorageKey(year, month));
    return raw ? JSON.parse(raw) : {};
  }

  function saveMonthData(year, month, data) {
    const key = getStorageKey(year, month);
    localStorage.setItem(key, JSON.stringify(data));
    if (db) {
      db.ref(`ganancias/${key}`).set(data);
    }
  }

  function getDaysMonToSat(year, month) {
    const days = [];
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) { // Omitir domingos
        const formattedDate = date.toISOString().split('T')[0];
        days.push({
          dateStr: formattedDate,
          dayNum: date.getDate(),
          dayName: dayNames[dayOfWeek],
          isSaturday: dayOfWeek === 6
        });
      }
      date.setDate(date.getDate() + 1);
    }

    return days;
  }

  function getWeeksOfMonth(year, month) {
    const days = getDaysMonToSat(year, month);
    const weeks = [];
    let currentWeekNum = 1;
    let currentWeekDays = [];

    days.forEach((day, index) => {
      currentWeekDays.push(day);

      if (day.isSaturday || index === days.length - 1) {
        weeks.push({
          weekNum: currentWeekNum,
          days: [...currentWeekDays]
        });
        currentWeekNum++;
        currentWeekDays = [];
      }
    });

    return weeks;
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  }

  function renderTable() {
    restoreBillInputs();
    if (typeof restorePaperInput === 'function') restorePaperInput();
    const monthData = loadMonthData(currentYear, currentMonthIndex);
    const weeks = getWeeksOfMonth(currentYear, currentMonthIndex);
    const selectedFilterWeek = weekFilterSelect ? weekFilterSelect.value : 'all';

    tableBody.innerHTML = '';

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    weeks.forEach(week => {
      if (selectedFilterWeek !== 'all' && parseInt(selectedFilterWeek) !== week.weekNum) {
        return;
      }

      let weekCash = 0;
      let weekTransfer = 0;
      let weekExpense = 0;

      week.days.forEach(day => {
        const row = document.createElement('tr');
        const isToday = (day.dateStr === todayStr);

        row.classList.add(`week-row-${week.weekNum}`);
        if (isToday) {
          row.classList.add('today-row');
        }

        const dayData = monthData[day.dateStr] || { cash: 0, transfer: 0, expense: 0, note: '' };
        const cash = parseFloat(dayData.cash) || 0;
        const transfer = parseFloat(dayData.transfer) || 0;
        const expense = parseFloat(dayData.expense) || 0;
        const net = (cash + transfer) - expense;

        weekCash += cash;
        weekTransfer += transfer;
        weekExpense += expense;

        row.innerHTML = `
          <td>
            <span class="day-badge ${day.isSaturday ? 'saturday' : ''}">${day.dayName}</span>
            <strong>${day.dayNum}</strong>
            ${isToday ? '<span class="today-badge">HOY</span>' : ''}
          </td>
          <td>
            <input type="number" step="0.01" min="0" class="amount-input field-cash" 
                   data-date="${day.dateStr}" value="${dayData.cash || ''}" placeholder="0.00">
          </td>
          <td>
            <input type="number" step="0.01" min="0" class="amount-input field-transfer" 
                   data-date="${day.dateStr}" value="${dayData.transfer || ''}" placeholder="0.00">
          </td>
          <td>
            <input type="number" step="0.01" min="0" class="amount-input field-expense" style="color: #ef4444;"
                   data-date="${day.dateStr}" value="${dayData.expense || ''}" placeholder="0.00">
          </td>
          <td>
            <strong class="net-display" id="net-${day.dateStr}">${formatCurrency(net)}</strong>
          </td>
          <td>
            <input type="text" class="note-input field-note" 
                   data-date="${day.dateStr}" value="${dayData.note || ''}" placeholder="Nota u observación...">
          </td>
          <td class="action-cell">
            <button class="btn-icon send-whatsapp-single" data-date="${day.dateStr}" title="Enviar corte de este día a WhatsApp">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });

      const weekNet = (weekCash + weekTransfer) - weekExpense;
      const subtotalRow = document.createElement('tr');
      subtotalRow.classList.add('week-subtotal-row');
      subtotalRow.classList.add(`week-row-${week.weekNum}`);
      subtotalRow.innerHTML = `
        <td><strong>SUBTOTAL SEMANA ${week.weekNum}</strong></td>
        <td>${formatCurrency(weekCash)}</td>
        <td>${formatCurrency(weekTransfer)}</td>
        <td style="color: #ef4444;">${formatCurrency(weekExpense)}</td>
        <td style="color: #10b981;"><strong>${formatCurrency(weekNet)}</strong></td>
        <td colspan="2"><em>Resumen Semana ${week.weekNum}</em></td>
      `;
      tableBody.appendChild(subtotalRow);
    });

    document.querySelectorAll('.amount-input, .note-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const dateStr = e.target.dataset.date;
        const currentData = loadMonthData(currentYear, currentMonthIndex);
        
        if (!currentData[dateStr]) {
          currentData[dateStr] = { cash: 0, transfer: 0, expense: 0, note: '' };
        }

        if (e.target.classList.contains('field-cash')) {
          currentData[dateStr].cash = parseFloat(e.target.value) || 0;
        } else if (e.target.classList.contains('field-transfer')) {
          currentData[dateStr].transfer = parseFloat(e.target.value) || 0;
        } else if (e.target.classList.contains('field-expense')) {
          currentData[dateStr].expense = parseFloat(e.target.value) || 0;
        } else if (e.target.classList.contains('field-note')) {
          currentData[dateStr].note = e.target.value;
        }

        saveMonthData(currentYear, currentMonthIndex, currentData);
        
        // Actualizar subtotal y neto de la fila
        const cash = parseFloat(currentData[dateStr].cash) || 0;
        const transfer = parseFloat(currentData[dateStr].transfer) || 0;
        const expense = parseFloat(currentData[dateStr].expense) || 0;
        const net = (cash + transfer) - expense;

        const netEl = document.getElementById(`net-${dateStr}`);
        if (netEl) netEl.textContent = formatCurrency(net);

        updateCalculations();
        updateBillCalculations();

        // Actualizar el valor en la fila de Subtotal de Semana visualmente
        const weeks = getWeeksOfMonth(currentYear, currentMonthIndex);
        weeks.forEach(week => {
          let wCash = 0, wTrans = 0, wExp = 0;
          week.days.forEach(d => {
            const entry = currentData[d.dateStr] || { cash: 0, transfer: 0, expense: 0 };
            wCash += parseFloat(entry.cash) || 0;
            wTrans += parseFloat(entry.transfer) || 0;
            wExp += parseFloat(entry.expense) || 0;
          });
          const subtotalRows = document.querySelectorAll('.week-subtotal-row');
          subtotalRows.forEach(subRow => {
            if (subRow.textContent.includes(`SUBTOTAL SEMANA ${week.weekNum}`)) {
              const tds = subRow.querySelectorAll('td');
              if (tds.length >= 5) {
                tds[1].textContent = formatCurrency(wCash);
                tds[2].textContent = formatCurrency(wTrans);
                tds[3].textContent = formatCurrency(wExp);
                tds[4].innerHTML = `<strong>${formatCurrency((wCash + wTrans) - wExp)}</strong>`;
              }
            }
          });
        });
      });
    });

    document.querySelectorAll('.send-whatsapp-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.dataset.date;
        openWhatsAppModalForDate(dateStr);
      });
    });

    updateCalculations();
    updateBillCalculations();
  }

  function calculateLinearRegressionAvg(days, monthData) {
    if (!monthData) monthData = loadMonthData(currentYear, currentMonthIndex);
    if (!days) days = getDaysMonToSat(currentYear, currentMonthIndex);
    if (!days || days.length === 0) return 0;

    const points = [];
    let actualSumNet = 0;
    let seqIndex = 1;

    days.forEach(day => {
      const data = monthData[day.dateStr];
      const cash = data ? (parseFloat(data.cash) || 0) : 0;
      const transfer = data ? (parseFloat(data.transfer) || 0) : 0;
      const expense = data ? (parseFloat(data.expense) || 0) : 0;
      const net = (cash + transfer) - expense;

      if (cash !== 0 || transfer !== 0 || expense !== 0) {
        points.push({ x: seqIndex, dayNum: day.dayNum, y: net });
        actualSumNet += net;
      }
      seqIndex++;
    });

    const filledCount = points.length;
    if (filledCount === 0) return 0;

    const totalDaysInMonth = days.length;
    const realAvgSoFar = actualSumNet / filledCount;

    let slope = 0;
    let intercept = realAvgSoFar;

    if (filledCount >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += (p.x * p.y);
        sumXX += (p.x * p.x);
      });

      const denominator = (filledCount * sumXX - (sumX * sumX));
      if (denominator !== 0) {
        slope = (filledCount * sumXY - sumX * sumY) / denominator;
        intercept = (sumY - slope * sumX) / filledCount;
      }
    }

    // Estimar el valor para los días restantes con filtro de prudencia (evita inflar si hubo un día atípico muy alto)
    let totalProjectedNet = actualSumNet;
    let idx = 1;
    const maxReasonableDayValue = realAvgSoFar * 1.8; // Límite máximo prudente de proyección por día

    days.forEach(day => {
      const isFilled = points.some(p => p.dayNum === day.dayNum);
      if (!isFilled) {
        let predictedForDay = slope * idx + intercept;
        // Acotar la estimación para que no infle de más si la recta crece demasiado rápido
        predictedForDay = Math.max(0, Math.min(predictedForDay, maxReasonableDayValue > 0 ? maxReasonableDayValue : predictedForDay));
        totalProjectedNet += predictedForDay;
      }
      idx++;
    });

    return totalProjectedNet / totalDaysInMonth;
  }

  function updateCalculations() {
    const monthData = loadMonthData(currentYear, currentMonthIndex);
    const days = getDaysMonToSat(currentYear, currentMonthIndex);

    let monthNetTotal = 0;
    let monthExpensesTotal = 0;
    let monthCashTotal = 0;
    let monthTransferTotal = 0;
    let daysCount = 0;

    days.forEach(day => {
      const dayData = monthData[day.dateStr];
      if (dayData) {
        const cash = parseFloat(dayData.cash) || 0;
        const transfer = parseFloat(dayData.transfer) || 0;
        const expense = parseFloat(dayData.expense) || 0;
        const net = (cash + transfer) - expense;

        if (cash > 0 || transfer > 0 || expense > 0) {
          monthNetTotal += net;
          monthCashTotal += cash;
          monthTransferTotal += transfer;
          monthExpensesTotal += expense;
          daysCount++;
        }
      }
    });

    let yearNetTotal = 0;
    for (let m = 0; m < 12; m++) {
      const mData = loadMonthData(currentYear, m);
      Object.values(mData).forEach(d => {
        const cash = parseFloat(d.cash) || 0;
        const transfer = parseFloat(d.transfer) || 0;
        const expense = parseFloat(d.expense) || 0;
        yearNetTotal += (cash + transfer) - expense;
      });
    }

    // Predicción por Regresión Lineal basada en la tendencia de los datos existentes
    const avgDailyPrediction = calculateLinearRegressionAvg(days, monthData);

    if (totalMonthEl) totalMonthEl.textContent = formatCurrency(monthNetTotal);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(monthExpensesTotal);
    if (totalYearEl) totalYearEl.textContent = formatCurrency(yearNetTotal);

    const avgDailyCardDisplay = document.getElementById('avgDaily');
    if (avgDailyCardDisplay) {
      avgDailyCardDisplay.textContent = formatCurrency(avgDailyPrediction);
    }
    if (activeDaysEl) activeDaysEl.textContent = `${daysCount} de ${days.length} días`;

    const titleText = `${monthNames[currentMonthIndex]} ${currentYear}`;
    monthTitleEl.textContent = `Listado de Ganancias — Mes de ${titleText}`;
    printHeaderTitle.textContent = `Corte de Ganancias - ${titleText}`;
    printTotalMonth.textContent = formatCurrency(monthNetTotal);
    printActiveDays.textContent = `${daysCount} de ${days.length} días`;

    // Recalcular la diferencia en el Arqueo de Caja al actualizar celdas de la tabla
    if (typeof updateBillCalculations === 'function') {
      updateBillCalculations();
    }
  }

  function openWhatsAppModalForDate(dateStr) {
    const dateSelectGroup = document.getElementById('dateSelectGroup');
    const datePickerSelect = document.getElementById('datePickerSelect');
    
    if (weekSelectGroup) weekSelectGroup.style.display = 'none';
    if (dateSelectGroup) dateSelectGroup.style.display = 'block';

    if (datePickerSelect) {
      datePickerSelect.value = dateStr;
      datePickerSelect.onchange = (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
          openWhatsAppModalForDate(selectedDate);
        }
      };
    }

    // Cargar los datos correspondientes a la fecha seleccionada
    const dParts = dateStr.split('-');
    const targetYear = parseInt(dParts[0]);
    const targetMonthIndex = parseInt(dParts[1]) - 1;

    const monthData = loadMonthData(targetYear, targetMonthIndex);
    const dayData = monthData[dateStr] || { cash: 0, transfer: 0, expense: 0, note: '' };
    
    const cash = parseFloat(dayData.cash) || 0;
    const transfer = parseFloat(dayData.transfer) || 0;
    const expense = parseFloat(dayData.expense) || 0;
    const net = (cash + transfer) - expense;

    const dateObj = new Date(targetYear, targetMonthIndex, parseInt(dParts[2]));
    const dayName = dayNames[dateObj.getDay()];
    const dateFormatted = `${dayName} ${dParts[2]} de ${monthNames[targetMonthIndex]} de ${targetYear}`;

    let monthAccumulatedNet = 0;
    const days = getDaysMonToSat(targetYear, targetMonthIndex);
    days.forEach(day => {
      const data = monthData[day.dateStr];
      if (data) {
        const c = parseFloat(data.cash) || 0;
        const t = parseFloat(data.transfer) || 0;
        const e = parseFloat(data.expense) || 0;
        monthAccumulatedNet += (c + t) - e;
      }
    });

    const letterPacks = parseInt(localStorage.getItem(`papel_carta_${targetYear}_${targetMonthIndex}`)) || 0;
    const legalPacks = parseInt(localStorage.getItem(`papel_oficio_${targetYear}_${targetMonthIndex}`)) || 0;

    const letterConsumedPacks = parseInt(localStorage.getItem(`papel_carta_consumido_${targetYear}_${targetMonthIndex}`)) || 0;
    const legalConsumedPacks = parseInt(localStorage.getItem(`papel_oficio_consumido_${targetYear}_${targetMonthIndex}`)) || 0;

    function formatPaperForReport(packs) {
      if (packs >= 10) {
        const b = Math.floor(packs / 10), l = packs % 10;
        return `${b} ${b === 1 ? 'Caja' : 'Cajas'}${l > 0 ? ` y ${l} Paq.` : ''}`;
      } else if (packs > 0) {
        return `${packs} ${packs === 1 ? 'Paquete' : 'Paquetes'}`;
      } else {
        return `0 Paquetes`;
      }
    }

    const consumedText = (letterConsumedPacks > 0 || legalConsumedPacks > 0)
      ? `\n🔥 *PAPEL CONSUMIDO:*\n📄 *Carta:* ${formatPaperForReport(letterConsumedPacks)}\n📑 *Oficio:* ${formatPaperForReport(legalConsumedPacks)}\n`
      : '';

    const paperReportText = `\n📦 *INVENTARIO DE PAPEL:*\n📄 *Carta:* ${formatPaperForReport(letterPacks)}\n📑 *Oficio:* ${formatPaperForReport(legalPacks)}\n${consumedText}`;

    const noteText = dayData.note ? `\n📝 *Nota:* ${dayData.note}` : '';

    // Calcular el TOTAL INICIO DÍA del conteo de billetes (start)
    let startBillTotal = 0;
    const startBillData = loadBillData('start');
    if (startBillData && startBillData.bills) {
      Object.keys(startBillData.bills).forEach(denom => {
        startBillTotal += (parseFloat(denom) || 0) * (parseInt(startBillData.bills[denom]) || 0);
      });
      startBillTotal += (parseFloat(startBillData.coins) || 0);
      startBillTotal += (parseFloat(startBillData.initial) || 0);
    }

    const textMessage = `📊 *CORTE DIARIO DE GANANCIAS*\n📅 *Fecha:* ${dateFormatted}\n\n💵 *Efectivo:* ${formatCurrency(cash)}\n💳 *Transferencias:* ${formatCurrency(transfer)}\n📉 *Gastos:* ${formatCurrency(expense)}\n------------------------\n💰 *Total Neto del Día:* ${formatCurrency(net)}\n💵 *Total de Efectivo en Caja:* ${formatCurrency(startBillTotal)}${paperReportText}${noteText}\n\n📈 *Acumulado Neto del Mes:* ${formatCurrency(monthAccumulatedNet)}\n\n_Enviado desde Registro de Ganancias_`;

    phoneInput.value = savedPhone;
    whatsappPreview.textContent = textMessage;
    
    sendWhatsAppModalBtn.onclick = () => {
      const phone = phoneInput.value.trim().replace(/\D/g, '');
      if (phone) {
        localStorage.setItem('whatsapp_phone', phone);
        savedPhone = phone;
      }
      
      const encodedMsg = encodeURIComponent(textMessage);
      const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
      
      window.open(whatsappUrl, '_blank');
      whatsappModal.classList.remove('active');
    };

    const telegramUserHostInput = document.getElementById('telegramUserHost');
    const defaultChannelLink = '@Romitacopiado';
    const savedTelegramHost = localStorage.getItem('telegram_channel') || defaultChannelLink;
    if (telegramUserHostInput) telegramUserHostInput.value = savedTelegramHost;

    const sendTelegramModalBtn = document.getElementById('sendTelegramModalBtn');
    if (sendTelegramModalBtn) {
      sendTelegramModalBtn.onclick = () => sendTelegramAction(textMessage);
    }

    whatsappModal.classList.add('active');
  }

  async function sendTelegramAction(msgText, imageBlob = null) {
    const BOT_TOKEN = '8655052624:AAFJLbq-Y5HgAe-Urowo0FrRst5dyVm6TxM';
    const telegramUserHostInput = document.getElementById('telegramUserHost');
    const defaultChannelLink = '@Romitacopiado';
    let tgHost = (telegramUserHostInput && telegramUserHostInput.value.trim()) ? telegramUserHostInput.value.trim() : defaultChannelLink;

    if (!tgHost.startsWith('@') && !tgHost.includes('/')) {
      tgHost = '@' + tgHost;
    }
    const channelId = tgHost.replace('https://t.me/', '');

    if (tgHost) {
      localStorage.setItem('telegram_channel', tgHost);
    }

    const cleanMsg = msgText.replace(/\*/g, '');

    // Intentar enviar la imagen si está disponible
    if (imageBlob) {
      try {
        const formData = new FormData();
        formData.append('chat_id', channelId);
        formData.append('photo', imageBlob, 'corte_semanal.png');
        formData.append('caption', cleanMsg);

        const photoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData
        });

        const photoData = await photoRes.json();
        if (photoData.ok) {
          alert('🚀 ¡Corte e Imagen de Tabla enviados AUTOMÁTICAMENTE a @Romitacopiado!');
          if (whatsappModal) whatsappModal.classList.remove('active');
          return true;
        }
      } catch (e) {
        console.warn('Falló el envío de foto, procediendo a texto:', e);
      }
    }

    // Envío por URL garantizado de texto al canal @Romitacopiado
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${encodeURIComponent(channelId)}&text=${encodeURIComponent(cleanMsg)}`;
      const response = await fetch(url);
      const resData = await response.json();

      if (resData.ok) {
        alert('🚀 ¡Corte publicado DIRECTAMENTE en tu canal @Romitacopiado!');
        if (whatsappModal) whatsappModal.classList.remove('active');
        return true;
      } else {
        alert(`⚠️ Telegram respondió: ${resData.description}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con la API de Telegram.');
    }
    return false;
  }

  function getTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function openWhatsAppModalForWeek() {
    const monthData = loadMonthData(currentYear, currentMonthIndex);
    const weeks = getWeeksOfMonth(currentYear, currentMonthIndex);
    const todayStr = getTodayStr();

    let currentWeekNumToSelect = 1;

    weekSelect.innerHTML = '';
    weeks.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      const firstDay = w.days[0].dayNum;
      const lastDay = w.days[w.days.length - 1].dayNum;
      opt.textContent = `Semana ${w.weekNum} (${firstDay} al ${lastDay} de ${monthNames[currentMonthIndex]})`;
      
      // Si el día de hoy cae dentro de esta semana, marcarla para autoseleccionarla
      const containsToday = w.days.some(d => d.dateStr === todayStr);
      if (containsToday) {
        currentWeekNumToSelect = w.weekNum;
      }

      weekSelect.appendChild(opt);
    });

    const dateSelectGroup = document.getElementById('dateSelectGroup');
    if (dateSelectGroup) dateSelectGroup.style.display = 'none';

    weekSelect.value = currentWeekNumToSelect;
    weekSelectGroup.style.display = 'block';

    function updateWeekPreview() {
      const selectedWeekNum = parseInt(weekSelect.value) || 1;
      const week = weeks.find(w => w.weekNum === selectedWeekNum) || weeks[0];

      let weekCash = 0;
      let weekTransfer = 0;
      let weekExpense = 0;
      let weekDaysCount = 0;

      week.days.forEach(day => {
        const data = monthData[day.dateStr];
        if (data) {
          const c = parseFloat(data.cash) || 0;
          const t = parseFloat(data.transfer) || 0;
          const e = parseFloat(data.expense) || 0;
          
          weekCash += c;
          weekTransfer += t;
          weekExpense += e;
          if (c > 0 || t > 0 || e > 0) weekDaysCount++;
        }
      });

      const weekNet = (weekCash + weekTransfer) - weekExpense;
      const weekBoxCash = weekCash - weekExpense;
      const firstDay = week.days[0].dayNum;
      const lastDay = week.days[week.days.length - 1].dayNum;
      const weekLabel = `del ${firstDay} al ${lastDay} de ${monthNames[currentMonthIndex]}`;

      const letterPacks = parseInt(localStorage.getItem(`papel_carta_${currentYear}_${currentMonthIndex}`)) || 0;
      const legalPacks = parseInt(localStorage.getItem(`papel_oficio_${currentYear}_${currentMonthIndex}`)) || 0;

      const letterConsumedPacks = parseInt(localStorage.getItem(`papel_carta_consumido_${currentYear}_${currentMonthIndex}`)) || 0;
      const legalConsumedPacks = parseInt(localStorage.getItem(`papel_oficio_consumido_${currentYear}_${currentMonthIndex}`)) || 0;

      function formatPaperForReport(packs) {
        if (packs >= 10) {
          const b = Math.floor(packs / 10), l = packs % 10;
          return `${b} ${b === 1 ? 'Caja' : 'Cajas'}${l > 0 ? ` y ${l} Paq.` : ''}`;
        } else if (packs > 0) {
          return `${packs} ${packs === 1 ? 'Paquete' : 'Paquetes'}`;
        } else {
          return `0 Paquetes`;
        }
      }

      const consumedText = (letterConsumedPacks > 0 || legalConsumedPacks > 0)
        ? `\n🔥 *PAPEL CONSUMIDO:*\n📄 *Carta:* ${formatPaperForReport(letterConsumedPacks)}\n📑 *Oficio:* ${formatPaperForReport(legalConsumedPacks)}\n`
        : '';

      const paperReportText = `\n📦 *INVENTARIO DE PAPEL:*\n📄 *Carta:* ${formatPaperForReport(letterPacks)}\n📑 *Oficio:* ${formatPaperForReport(legalPacks)}\n${consumedText}`;

      const textMessage = `📅 *CORTE DE SEMANA ${week.weekNum}*\n📆 *Periodo:* ${weekLabel}\n\n💵 *Efectivo Semanal:* ${formatCurrency(weekCash)}\n💳 *Transferencias Semanal:* ${formatCurrency(weekTransfer)}\n📉 *Gastos Semanales:* ${formatCurrency(weekExpense)}\n------------------------\n💰 *TOTAL NETO SEMANA ${week.weekNum}:* ${formatCurrency(weekNet)}${paperReportText}\n📊 *Días Trabajados:* ${weekDaysCount} de ${week.days.length} días\n\n_Enviado desde Registro de Ganancias_`;

      whatsappPreview.textContent = textMessage;
      return textMessage;
    }

    weekSelect.onchange = updateWeekPreview;
    updateWeekPreview();

    phoneInput.value = savedPhone;

    sendWhatsAppModalBtn.onclick = () => {
      const phone = phoneInput.value.trim().replace(/\D/g, '');
      if (phone) {
        localStorage.setItem('whatsapp_phone', phone);
        savedPhone = phone;
      }
      
      const msgToSend = updateWeekPreview();
      const encodedMsg = encodeURIComponent(msgToSend);
      const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
      
      window.open(whatsappUrl, '_blank');
      whatsappModal.classList.remove('active');
    };

    const sendTelegramModalBtn = document.getElementById('sendTelegramModalBtn');
    if (sendTelegramModalBtn) {
      sendTelegramModalBtn.onclick = async () => {
        const msgToSend = updateWeekPreview();
        const sendBtn = sendTelegramModalBtn;
        const originalText = sendBtn.textContent;
        sendBtn.textContent = '⏳ Enviando...';
        sendBtn.disabled = true;

        const selectedWeekNum = parseInt(weekSelect.value) || 1;
        const mainTableCard = document.getElementById('mainEarningsTableCard');

        // Ocultar temporalmente las filas de otras semanas para que la foto muestre solo la semana elegida
        const allTableRows = document.querySelectorAll('#tableBody tr');
        const hiddenRows = [];
        allTableRows.forEach(row => {
          if (!row.classList.contains(`week-row-${selectedWeekNum}`)) {
            hiddenRows.push({ el: row, display: row.style.display });
            row.style.display = 'none';
          }
        });

        if (mainTableCard && typeof html2canvas === 'function') {
          try {
            const canvas = await Promise.race([
              html2canvas(mainTableCard, { scale: 1.5, backgroundColor: '#1e293b', logging: false }),
              new Promise((_, reject) => setTimeout(() => reject('timeout'), 2500))
            ]);

            imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          } catch (e) {
            console.warn('Captura no generada a tiempo, se envía texto:', e);
          }
        }

        // Restaurar visibilidad de la tabla en pantalla
        hiddenRows.forEach(item => {
          item.el.style.display = item.display;
        });

        await sendTelegramAction(msgToSend, imageBlob);

        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
      };
    }

    whatsappModal.classList.add('active');
  }

  function openWhatsAppModalForMonth() {
    const dateSelectGroup = document.getElementById('dateSelectGroup');
    if (weekSelectGroup) weekSelectGroup.style.display = 'none';
    if (dateSelectGroup) dateSelectGroup.style.display = 'none';

    const monthData = loadMonthData(currentYear, currentMonthIndex);
    const days = getDaysMonToSat(currentYear, currentMonthIndex);

    let monthCash = 0;
    let monthTransfer = 0;
    let monthExpense = 0;
    let daysTranscurridos = 0;

    days.forEach(day => {
      const data = monthData[day.dateStr];
      if (data) {
        const c = parseFloat(data.cash) || 0;
        const t = parseFloat(data.transfer) || 0;
        const e = parseFloat(data.expense) || 0;

        monthCash += c;
        monthTransfer += t;
        monthExpense += e;

        if (c > 0 || t > 0 || e > 0) {
          daysTranscurridos++;
        }
      }
    });

    const monthNet = (monthCash + monthTransfer) - monthExpense;
    const avgDailyPrediction = calculateLinearRegressionAvg(days, monthData);
    const monthTitle = `${monthNames[currentMonthIndex]} ${currentYear}`;

    const letterPacks = parseInt(localStorage.getItem(`papel_carta_${currentYear}_${currentMonthIndex}`)) || 0;
    const legalPacks = parseInt(localStorage.getItem(`papel_oficio_${currentYear}_${currentMonthIndex}`)) || 0;

    const letterConsumedPacks = parseInt(localStorage.getItem(`papel_carta_consumido_${currentYear}_${currentMonthIndex}`)) || 0;
    const legalConsumedPacks = parseInt(localStorage.getItem(`papel_oficio_consumido_${currentYear}_${currentMonthIndex}`)) || 0;

    function formatPaperForReport(packs) {
      if (packs >= 10) {
        const b = Math.floor(packs / 10), l = packs % 10;
        return `${b} ${b === 1 ? 'Caja' : 'Cajas'}${l > 0 ? ` y ${l} Paq.` : ''}`;
      } else if (packs > 0) {
        return `${packs} ${packs === 1 ? 'Paquete' : 'Paquetes'}`;
      } else {
        return `0 Paquetes`;
      }
    }

    const consumedText = (letterConsumedPacks > 0 || legalConsumedPacks > 0)
      ? `\n🔥 *PAPEL CONSUMIDO:*\n📄 *Carta:* ${formatPaperForReport(letterConsumedPacks)}\n📑 *Oficio:* ${formatPaperForReport(legalConsumedPacks)}\n`
      : '';

    const paperReportText = `\n📦 *INVENTARIO DE PAPEL:*\n📄 *Carta:* ${formatPaperForReport(letterPacks)}\n📑 *Oficio:* ${formatPaperForReport(legalPacks)}\n${consumedText}`;

    const textMessage = `📊 *CORTE GENERAL DE MES — ${monthTitle.toUpperCase()}*\n\n📆 *Días Registrados/Transcurridos:* ${daysTranscurridos} de ${days.length} días hábiles\n\n💵 *Total Efectivo Cobrado:* ${formatCurrency(monthCash)}\n💳 *Total Transferencias (Banca):* ${formatCurrency(monthTransfer)}\n📉 *Total Gastos Pagados:* ${formatCurrency(monthExpense)}\n----------------------------------------\n💰 *GANANCIA NETO DEL MES:* ${formatCurrency(monthNet)}${paperReportText}\n📈 *Predicción Promedio Diario:* ${formatCurrency(avgDailyPrediction)}\n\n_Enviado desde Registro de Ganancias_`;

    phoneInput.value = savedPhone;
    whatsappPreview.textContent = textMessage;

    sendWhatsAppModalBtn.onclick = () => {
      const phone = phoneInput.value.trim().replace(/\D/g, '');
      if (phone) {
        localStorage.setItem('whatsapp_phone', phone);
        savedPhone = phone;
      }

      const encodedMsg = encodeURIComponent(textMessage);
      const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;

      window.open(whatsappUrl, '_blank');
      whatsappModal.classList.remove('active');
    };

    const sendTelegramModalBtn = document.getElementById('sendTelegramModalBtn');
    if (sendTelegramModalBtn) {
      sendTelegramModalBtn.onclick = () => sendTelegramAction(textMessage);
    }

    whatsappModal.classList.add('active');
  }

  cancelModalBtn.addEventListener('click', () => {
    whatsappModal.classList.remove('active');
  });

  if (closeDayWhatsAppBtn) {
    closeDayWhatsAppBtn.addEventListener('click', () => {
      openWhatsAppModalForDate(getTodayStr());
    });
  }

  if (closeWeekWhatsAppBtn) {
    closeWeekWhatsAppBtn.addEventListener('click', () => {
      openWhatsAppModalForWeek();
    });
  }

  if (closeMonthWhatsAppBtn) {
    closeMonthWhatsAppBtn.addEventListener('click', () => {
      openWhatsAppModalForMonth();
    });
  }

  function openAnnualSurveyModal() {
    annualModalTitle.textContent = `🔍 Sondeo Acumulado Anual — Año ${currentYear}`;
    annualBreakdownBody.innerHTML = '';

    let grandTotalYear = 0;

    for (let m = 0; m < 12; m++) {
      const mData = loadMonthData(currentYear, m);
      let monthNet = 0;

      Object.values(mData).forEach(d => {
        const cash = parseFloat(d.cash) || 0;
        const transfer = parseFloat(d.transfer) || 0;
        const expense = parseFloat(d.expense) || 0;
        monthNet += (cash + transfer) - expense;
      });

      grandTotalYear += monthNet;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      tr.innerHTML = `
        <td style="padding: 0.5rem; color: ${m === currentMonthIndex ? '#38bdf8' : '#e2e8f0'}; font-weight: ${m === currentMonthIndex ? 'bold' : 'normal'};">
          ${monthNames[m]} ${m === currentMonthIndex ? '(Mes Actual)' : ''}
        </td>
        <td style="padding: 0.5rem; text-align: right; font-weight: bold; color: ${monthNet > 0 ? '#10b981' : '#94a3b8'};">
          ${formatCurrency(monthNet)}
        </td>
      `;
      annualBreakdownBody.appendChild(tr);
    }

    annualGrandTotal.textContent = formatCurrency(grandTotalYear);
    annualModal.classList.add('active');
  }

  if (annualSurveyBtn) {
    annualSurveyBtn.addEventListener('click', openAnnualSurveyModal);
  }

  // --- LÓGICA DE CONTADORES DE BILLETES (INICIO DE DÍA Y FIN DE DÍA) ---
  function getBillStorageKey(type) {
    return `billetes_${type}_${currentYear}_${currentMonthIndex}`;
  }

  function loadBillData(type) {
    const raw = localStorage.getItem(getBillStorageKey(type));
    if (!raw) return { initial: 0, bills: {}, coins: 0 };
    try { return JSON.parse(raw); } catch (e) { return { initial: 0, bills: {}, coins: 0 }; }
  }

  function saveBillData(type) {
    const isStart = (type === 'start');
    const initialEl = document.querySelector(isStart ? '.bill-start-initial' : '.bill-end-initial');
    const coinsEl = document.querySelector(isStart ? '.bill-start-coins' : '.bill-end-coins');
    const inputs = document.querySelectorAll(isStart ? '.bill-start-input' : '.bill-end-input');

    const billsData = {
      initial: parseFloat(initialEl ? initialEl.value : 0) || 0,
      coins: parseFloat(coinsEl ? coinsEl.value : 0) || 0,
      bills: {}
    };

    inputs.forEach(inp => {
      const denom = inp.dataset.denom;
      billsData.bills[denom] = parseInt(inp.value) || 0;
    });

    localStorage.setItem(getBillStorageKey(type), JSON.stringify(billsData));
  }

  function updateBillCalculations(type) {
    const isStart = (type === 'start');
    const prefix = isStart ? 'start' : 'end';
    const inputs = document.querySelectorAll(isStart ? '.bill-start-input' : '.bill-end-input');
    const coinsEl = document.querySelector(isStart ? '.bill-start-coins' : '.bill-end-coins');
    const initialEl = document.querySelector(isStart ? '.bill-start-initial' : '.bill-end-initial');
    const displayEl = document.getElementById(isStart ? 'startPhysicalTotalDisplay' : 'endPhysicalTotalDisplay');

    let total = 0;

    inputs.forEach(input => {
      const denom = parseFloat(input.dataset.denom) || 0;
      const count = parseInt(input.value) || 0;
      const subtotal = denom * count;
      total += subtotal;

      const subEl = document.getElementById(`${prefix}-sub-${denom}`);
      if (subEl) subEl.textContent = formatCurrency(subtotal);
    });

    const coins = parseFloat(coinsEl ? coinsEl.value : 0) || 0;
    total += coins;

    const subCoinsEl = document.getElementById(`${prefix}-sub-coins`);
    if (subCoinsEl) subCoinsEl.textContent = formatCurrency(coins);

    if (displayEl) displayEl.textContent = formatCurrency(total);

    saveBillData(type);
    calculateDayCashDifference();
  }

  function calculateDayCashDifference() {
    const summaryStartTotal = document.getElementById('summaryStartTotal');
    const summaryEndTotal = document.getElementById('summaryEndTotal');
    const dayCashDiffDisplay = document.getElementById('dayCashDiffDisplay');

    // Sumar Inicio de Día directamente desde pantalla
    let startTotal = 0;
    document.querySelectorAll('.bill-start-input').forEach(inp => {
      const denom = parseFloat(inp.dataset.denom) || 0;
      const count = parseInt(inp.value) || 0;
      startTotal += (denom * count);
    });
    const startCoins = parseFloat(document.querySelector('.bill-start-coins') ? document.querySelector('.bill-start-coins').value : 0) || 0;
    startTotal += startCoins;

    // Sumar Fin de Día directamente desde pantalla
    let endTotal = 0;
    document.querySelectorAll('.bill-end-input').forEach(inp => {
      const denom = parseFloat(inp.dataset.denom) || 0;
      const count = parseInt(inp.value) || 0;
      endTotal += (denom * count);
    });
    const endCoins = parseFloat(document.querySelector('.bill-end-coins') ? document.querySelector('.bill-end-coins').value : 0) || 0;
    endTotal += endCoins;

    // Si aún no hay cierre registrado en Fin de Día, el efectivo generado inicia en $0.00
    let generatedCash = 0;
    if (endTotal > 0) {
      generatedCash = endTotal - startTotal;
    }

    if (summaryStartTotal) summaryStartTotal.textContent = formatCurrency(startTotal);
    if (summaryEndTotal) summaryEndTotal.textContent = formatCurrency(endTotal);
    if (dayCashDiffDisplay) {
      dayCashDiffDisplay.textContent = formatCurrency(generatedCash);
      dayCashDiffDisplay.style.color = (generatedCash >= 0) ? '#f59e0b' : '#ef4444';
    }
  }

  function restoreBillInputs() {
    ['start', 'end'].forEach(type => {
      const isStart = (type === 'start');
      const data = loadBillData(type);
      
      const initialEl = document.querySelector(isStart ? '.bill-start-initial' : '.bill-end-initial');
      const coinsEl = document.querySelector(isStart ? '.bill-start-coins' : '.bill-end-coins');
      const inputs = document.querySelectorAll(isStart ? '.bill-start-input' : '.bill-end-input');

      if (initialEl) initialEl.value = data.initial || '';
      if (coinsEl) coinsEl.value = data.coins || '';

      inputs.forEach(inp => {
        const denom = inp.dataset.denom;
        inp.value = data.bills[denom] !== undefined && data.bills[denom] !== 0 ? data.bills[denom] : '';
      });

      updateBillCalculations(type);
    });
  }

  ['start', 'end'].forEach(type => {
    const isStart = (type === 'start');
    const inputs = document.querySelectorAll(isStart ? '.bill-start-input' : '.bill-end-input');
    const coinsEl = document.querySelector(isStart ? '.bill-start-coins' : '.bill-end-coins');
    const initialEl = document.querySelector(isStart ? '.bill-start-initial' : '.bill-end-initial');

    inputs.forEach(inp => {
      inp.addEventListener('input', () => updateBillCalculations(type));
      inp.addEventListener('change', () => updateBillCalculations(type));
    });

    if (initialEl) {
      initialEl.addEventListener('input', () => updateBillCalculations(type));
      initialEl.addEventListener('change', () => updateBillCalculations(type));
    }
  });

  const transferEndToStartBtn = document.getElementById('transferEndToStartBtn');
  if (transferEndToStartBtn) {
    transferEndToStartBtn.addEventListener('click', () => {
      const endData = loadBillData('end');
      localStorage.setItem(getBillStorageKey('start'), JSON.stringify(endData));

      const emptyEndData = { initial: 0, bills: {}, coins: 0 };
      localStorage.setItem(getBillStorageKey('end'), JSON.stringify(emptyEndData));

      restoreBillInputs();
      alert('✅ Todo el desglose de billetes del Cierre ha sido trasladado como Inicio del Nuevo Día.');
    });
  }

  // --- LÓGICA DEL CONTADOR DE PAPEL (CARTA Y OFICIO) ---
  const letterPacksInput = document.getElementById('letterPacksInput');
  const letterBoxesDisplay = document.getElementById('letterBoxesDisplay');
  const letterConsumedPacksInput = document.getElementById('letterConsumedPacksInput');
  const letterConsumedBoxesDisplay = document.getElementById('letterConsumedBoxesDisplay');

  const legalPacksInput = document.getElementById('legalPacksInput');
  const legalBoxesDisplay = document.getElementById('legalBoxesDisplay');
  const legalConsumedPacksInput = document.getElementById('legalConsumedPacksInput');
  const legalConsumedBoxesDisplay = document.getElementById('legalConsumedBoxesDisplay');

  function getPaperStorageKey(type) {
    return `papel_${type}_${currentYear}_${currentMonthIndex}`;
  }

  function updatePaperCalculations() {
    // Carta Inventario
    const letterPacks = parseInt(letterPacksInput ? letterPacksInput.value : 0) || 0;
    const letterBoxes = Math.floor(letterPacks / 10);
    const letterLoose = letterPacks % 10;

    if (letterBoxesDisplay) {
      if (letterPacks >= 10) {
        letterBoxesDisplay.textContent = `${letterBoxes} ${letterBoxes === 1 ? 'Caja' : 'Cajas'}${letterLoose > 0 ? ` y ${letterLoose} Paq.` : ''}`;
      } else {
        letterBoxesDisplay.textContent = `${letterPacks} ${letterPacks === 1 ? 'Paq.' : 'Paqs.'}`;
      }
    }

    // Carta Consumido
    const letterConsumed = parseInt(letterConsumedPacksInput ? letterConsumedPacksInput.value : 0) || 0;
    const letterConsumedBoxes = Math.floor(letterConsumed / 10);
    const letterConsumedLoose = letterConsumed % 10;

    if (letterConsumedBoxesDisplay) {
      if (letterConsumed >= 10) {
        letterConsumedBoxesDisplay.textContent = `${letterConsumedBoxes} ${letterConsumedBoxes === 1 ? 'Caja' : 'Cajas'}${letterConsumedLoose > 0 ? ` y ${letterConsumedLoose} Paq.` : ''}`;
      } else if (letterConsumed > 0) {
        letterConsumedBoxesDisplay.textContent = `${letterConsumed} ${letterConsumed === 1 ? 'Paq.' : 'Paqs.'}`;
      } else {
        letterConsumedBoxesDisplay.textContent = `-`;
      }
    }

    localStorage.setItem(getPaperStorageKey('carta'), letterPacks);
    localStorage.setItem(getPaperStorageKey('carta_consumido'), letterConsumed);

    // Oficio Inventario
    const legalPacks = parseInt(legalPacksInput ? legalPacksInput.value : 0) || 0;
    const legalBoxes = Math.floor(legalPacks / 10);
    const legalLoose = legalPacks % 10;

    if (legalBoxesDisplay) {
      if (legalPacks >= 10) {
        legalBoxesDisplay.textContent = `${legalBoxes} ${legalBoxes === 1 ? 'Caja' : 'Cajas'}${legalLoose > 0 ? ` y ${legalLoose} Paq.` : ''}`;
      } else {
        legalBoxesDisplay.textContent = `${legalPacks} ${legalPacks === 1 ? 'Paq.' : 'Paqs.'}`;
      }
    }

    // Oficio Consumido
    const legalConsumed = parseInt(legalConsumedPacksInput ? legalConsumedPacksInput.value : 0) || 0;
    const legalConsumedBoxes = Math.floor(legalConsumed / 10);
    const legalConsumedLoose = legalConsumed % 10;

    if (legalConsumedBoxesDisplay) {
      if (legalConsumed >= 10) {
        legalConsumedBoxesDisplay.textContent = `${legalConsumedBoxes} ${legalConsumedBoxes === 1 ? 'Caja' : 'Cajas'}${legalConsumedLoose > 0 ? ` y ${legalConsumedLoose} Paq.` : ''}`;
      } else if (legalConsumed > 0) {
        legalConsumedBoxesDisplay.textContent = `${legalConsumed} ${legalConsumed === 1 ? 'Paq.' : 'Paqs.'}`;
      } else {
        legalConsumedBoxesDisplay.textContent = `-`;
      }
    }

    localStorage.setItem(getPaperStorageKey('oficio'), legalPacks);
    localStorage.setItem(getPaperStorageKey('oficio_consumido'), legalConsumed);
  }

  function restorePaperInput() {
    const savedLetter = localStorage.getItem(getPaperStorageKey('carta'));
    const savedLetterConsumed = localStorage.getItem(getPaperStorageKey('carta_consumido'));
    const savedLegal = localStorage.getItem(getPaperStorageKey('oficio'));
    const savedLegalConsumed = localStorage.getItem(getPaperStorageKey('oficio_consumido'));

    if (letterPacksInput) {
      letterPacksInput.value = (savedLetter !== null && savedLetter !== '0') ? savedLetter : '';
    }
    if (letterConsumedPacksInput) {
      letterConsumedPacksInput.value = (savedLetterConsumed !== null && savedLetterConsumed !== '0') ? savedLetterConsumed : '';
    }

    if (legalPacksInput) {
      legalPacksInput.value = (savedLegal !== null && savedLegal !== '0') ? savedLegal : '';
    }
    if (legalConsumedPacksInput) {
      legalConsumedPacksInput.value = (savedLegalConsumed !== null && savedLegalConsumed !== '0') ? savedLegalConsumed : '';
    }

    updatePaperCalculations();
  }

  if (letterPacksInput) letterPacksInput.addEventListener('input', updatePaperCalculations);
  if (letterConsumedPacksInput) letterConsumedPacksInput.addEventListener('input', updatePaperCalculations);
  if (legalPacksInput) legalPacksInput.addEventListener('input', updatePaperCalculations);
  if (legalConsumedPacksInput) legalConsumedPacksInput.addEventListener('input', updatePaperCalculations);

  if (closeAnnualModalBtn) {
    closeAnnualModalBtn.addEventListener('click', () => {
      annualModal.classList.remove('active');
    });
  }

  closeDayWhatsAppBtn.addEventListener('click', () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    openWhatsAppModalForDate(todayStr);
  });

  closeWeekWhatsAppBtn.addEventListener('click', () => {
    openWhatsAppModalForWeek();
  });

  if (closeMonthWhatsAppBtn) {
    closeMonthWhatsAppBtn.addEventListener('click', () => {
      openWhatsAppModalForMonth();
    });
  }

  exportExcelBtn.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
      alert("La librería de Excel no se ha cargado correctamente.");
      return;
    }

    const wb = XLSX.utils.book_new();

    for (let m = 0; m < 12; m++) {
      const mData = loadMonthData(currentYear, m);
      const weeks = getWeeksOfMonth(currentYear, m);

      const rows = [
        ["Día", "Fecha", "Día Semana", "Efectivo ($)", "Transferencias ($)", "Gastos ($)", "Total Neto ($)", "Notas/Observaciones"]
      ];

      let mNetTotal = 0;
      let mExpensesTotal = 0;

      weeks.forEach(week => {
        let wCash = 0;
        let wTransfer = 0;
        let wExpense = 0;

        week.days.forEach(d => {
          const entry = mData[d.dateStr] || { cash: 0, transfer: 0, expense: 0, note: '' };
          const cash = parseFloat(entry.cash) || 0;
          const transfer = parseFloat(entry.transfer) || 0;
          const expense = parseFloat(entry.expense) || 0;
          const net = (cash + transfer) - expense;

          wCash += cash;
          wTransfer += transfer;
          wExpense += expense;

          rows.push([
            d.dayNum,
            d.dateStr,
            d.dayName,
            cash,
            transfer,
            expense,
            net,
            entry.note || ''
          ]);
        });

        const wNet = (wCash + wTransfer) - wExpense;
        mNetTotal += wNet;
        mExpensesTotal += wExpense;

        rows.push([
          `SUBTOTAL SEMANA ${week.weekNum}`,
          "",
          "",
          wCash,
          wTransfer,
          wExpense,
          wNet,
          `Resumen Semana ${week.weekNum}`
        ]);
        rows.push([]);
      });

      rows.push(["", "", "TOTAL GASTOS MES:", "", "", mExpensesTotal, "", ""]);
      rows.push(["", "", "TOTAL NETO MES:", "", "", "", mNetTotal, ""]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, monthNames[m]);
    }

    XLSX.writeFile(wb, `Registro_Ganancias_Por_Semanas_${currentYear}.xlsx`);
  });

  let dirHandle = null;
  const selectFolderBtn = document.getElementById('selectFolderBtn');

  if (selectFolderBtn) {
    selectFolderBtn.addEventListener('click', async () => {
      try {
        if ('showDirectoryPicker' in window) {
          dirHandle = await window.showDirectoryPicker();
          alert('✅ Carpeta vinculada con éxito. Los respaldos se guardarán automáticamente aquí.');
          saveAutoBackupToFolder();
        } else {
          alert('Tu navegador no soporta la selección directa de carpeta, se usará la descarga estándar.');
        }
      } catch (err) {
        console.log('Selección de carpeta cancelada');
      }
    });
  }

  async function saveAutoBackupToFolder() {
    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      backupData[key] = localStorage.getItem(key);
    }
    const jsonStr = JSON.stringify(backupData, null, 2);

    if (dirHandle) {
      try {
        const fileHandle = await dirHandle.getFileHandle('Respaldo_Ganancias_BASE.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        return;
      } catch (e) {
        console.error('Error al escribir en la carpeta seleccionada', e);
      }
    }
  }

  function triggerAutoDownloadBackup() {
    saveAutoBackupToFolder();

    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      backupData[key] = localStorage.getItem(key);
    }

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateSuffix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Automatico_Ganancias_${dateSuffix}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Cargar/Importar archivo JSON de Respaldo
  const restoreBtn = document.getElementById('restoreBtn');
  const restoreFileInput = document.getElementById('restoreFileInput');

  if (restoreBtn && restoreFileInput) {
    restoreBtn.addEventListener('click', () => {
      restoreFileInput.click();
    });

    restoreFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (typeof importedData === 'object' && importedData !== null) {
            Object.keys(importedData).forEach(key => {
              localStorage.setItem(key, importedData[key]);
            });

            alert('✅ Respaldo cargado correctamente.');
            renderTable();
          }
        } catch (err) {}
      };
      reader.readAsText(file);
    });
  }

  // Guardar en la carpeta vinculada al teclear en las celdas
  document.querySelectorAll('.amount-input, .note-input, .bill-input').forEach(inp => {
    inp.addEventListener('change', () => {
      saveAutoBackupToFolder();
    });
  });

  printBtn.addEventListener('click', () => {
    window.print();
  });

  initSelectors();
  renderTable();
});
