function calculateMonthlyPayment(loan, monthlyInterest, months) {
  if (monthlyInterest === 0) return loan / months;
  return loan * (monthlyInterest * Math.pow(1 + monthlyInterest, months)) / (Math.pow(1 + monthlyInterest, months) - 1);
}

document.getElementById('calcForm').addEventListener('submit', e => {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const equity = +document.getElementById('equity').value;
  const monthlyAbility = +document.getElementById('monthly').value;
  const annualInterest = +document.getElementById('interest').value / 100;
  const monthlyInterest = annualInterest / 12;
  const months = +document.getElementById('years').value * 12;
  const brokerPct = +document.getElementById('broker').value || 0;

  if (!equity || !monthlyAbility) {
    alert('אנא מלא את הון עצמי ויכולת החזר חודשית.');
    return;
  }

  const maxPct = (type === 'investment' ? 0.5 : type === 'first' ? 0.75 : 0.7);
  const factor = (Math.pow(1 + monthlyInterest, months) - 1) / (monthlyInterest * Math.pow(1 + monthlyInterest, months));
  let loanFromMonthly = monthlyAbility * factor;
  const maxLoanByEquity = equity * maxPct / (1 - maxPct);
  let loan = Math.min(loanFromMonthly, maxLoanByEquity);
  let price = equity + loan;

  let tax = 0;
  if (type === 'investment') {
    tax = price * 0.08;
  } else {
    const brackets = [
      { limit: 1978745, rate: 0 },
      { limit: 2347040, rate: 0.035 },
      { limit: 6055070, rate: 0.05 },
      { limit: Infinity, rate: 0.08 }
    ];
    let previousLimit = 0;
    for (const b of brackets) {
      if (price > previousLimit) {
        let taxableAmount = Math.min(price, b.limit) - previousLimit;
        tax += taxableAmount * b.rate;
        previousLimit = b.limit;
      }
    }
  }

  const lawyer = price * 0.0025;
  const broker = price * brokerPct / 100;
  const totalCost = price + tax + lawyer + broker;

  let balance = loan;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let monthlyPayment = calculateMonthlyPayment(loan, monthlyInterest, months);

  const monthlyDetails = [];
  for(let i = 1; i <= months; i++) {
    const interestPayment = balance * monthlyInterest;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalPrincipalPaid += principalPayment;
    totalInterestPaid += interestPayment;
    monthlyDetails.push({
      month: i,
      principal: principalPayment,
      interest: interestPayment,
      balance: balance > 0 ? balance : 0
    });
  }

  let resultHTML = `
    <p>🏠 <b>מחיר דירה עד:</b> ${price.toLocaleString()} ₪</p>
    <p>🧾 <b>מס רכישה:</b> ${tax.toLocaleString()} ₪</p>
    <p>👨‍⚖️ <b>עורך דין (0.25%):</b> ${lawyer.toLocaleString()} ₪</p>
    ${brokerPct > 0 ? `<p>🤝 <b>תיווך (${brokerPct}%):</b> ${broker.toLocaleString()} ₪</p>` : ''}
    <hr>
    <p>💵 <b>עלות כוללת משוערת:</b> ${totalCost.toLocaleString()} ₪</p>
    <h3>פירוט חודשי למשכנתא (תשלום חודשי: ${monthlyPayment.toFixed(2)} ₪)</h3>
    <table>
      <thead>
        <tr><th>חודש</th><th>קרן (₪)</th><th>ריבית (₪)</th><th>יתרה לאחר תשלום (₪)</th></tr>
      </thead>
      <tbody>
        ${monthlyDetails.slice(0, 12).map(row => `
          <tr>
            <td>${row.month}</td>
            <td>${row.principal.toFixed(2)}</td>
            <td>${row.interest.toFixed(2)}</td>
            <td>${row.balance.toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p><i>מציג 12 החודשים הראשונים מתוך ${months} חודשים</i></p>
  `;

  document.getElementById('result').innerHTML = resultHTML;

  const ctx = document.getElementById('costChart').getContext('2d');
  if(window.costChartInstance) {
    window.costChartInstance.destroy();
  }
  window.costChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['מחיר דירה', 'מס רכישה', 'עורך דין', 'תיווך'],
      datasets: [{
        data: [price, tax, lawyer, broker],
        backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'],
        hoverOffset: 20
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 20 } },
        tooltip: { enabled: true }
      }
    }
  });

});
