const modeSel = document.getElementById('mode');
const geoRow = document.getElementById('geoRow');
const photoRow = document.getElementById('photoRow');

modeSel.addEventListener('change', () => {
  geoRow.style.display = modeSel.value === 'restaurants' ? 'block' : 'none';
  photoRow.style.display = modeSel.value === 'photo' ? 'block' : 'none';
});

document.getElementById('geoBtn')?.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Геолокация недоступна');
  navigator.geolocation.getCurrentPosition(pos => {
    document.getElementById('lat').value = pos.coords.latitude;
    document.getElementById('lon').value = pos.coords.longitude;
  }, err => alert('Не удалось получить геолокацию'));
});

const form = document.getElementById('genForm');
const resultDiv = document.getElementById('result');

// Load profile on start
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('/api/profile');
    const p = await r.json();
    document.getElementById('prof_name').value = p.name || '';
    document.getElementById('prof_email').value = p.email || '';
    document.getElementById('prof_goals').value = p.goals || '';
  } catch {}
  refreshReminders();
});

// Save profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const resp = await fetch('/api/profile', { method: 'POST', body: fd });
  if (resp.ok) {
    alert('Профиль сохранен');
  } else {
    alert('Ошибка сохранения профиля');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultDiv.innerHTML = 'Генерация...';
  const fd = new FormData(form);
  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      body: fd
    });
    const data = await resp.json();
    if (!resp.ok) {
      resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      return;
    }
    renderResult(data);
  } catch (e) {
    resultDiv.textContent = 'Ошибка запроса';
  }
});

function renderResult(data) {
  const parts = [];
  parts.push(`<h3>Дефициты/цели</h3><pre>${JSON.stringify(data.deficits, null, 2)}</pre>`);
  parts.push(`<h3>Добавки</h3><pre>${JSON.stringify(data.vitamins, null, 2)}</pre>`);
  if (data.mode === 'restaurants') {
    parts.push(`<h3>Рестораны</h3><pre>${JSON.stringify(data.restaurants, null, 2)}</pre>`);
  } else {
    if (data.detected) {
      parts.push(`<h3>Обнаружено на фото/подсказке</h3><pre>${JSON.stringify(data.detected, null, 2)}</pre>`);
    }
    if (data.plan) {
      parts.push(`<h3>План на 7 дней</h3><pre>${JSON.stringify(data.plan, null, 2)}</pre>`);
    }
    if (data.shopping_list) {
      parts.push(`<h3>Список покупок</h3><pre>${JSON.stringify(data.shopping_list, null, 2)}</pre>`);
    }
  }
  resultDiv.innerHTML = parts.join('');
}

// Save labs & schedule reminder
document.getElementById('saveLabsBtn').addEventListener('click', async () => {
  const weeks = parseInt(document.getElementById('weeks').value || '10', 10);
  const labs_json = document.getElementById('labs').value;
  const fd = new FormData();
  fd.append('labs_json', labs_json);
  fd.append('weeks', String(weeks));
  const r = await fetch('/api/labs/save', { method: 'POST', body: fd });
  const data = await r.json();
  if (r.ok) {
    alert('Сохранено. Напоминание на ' + data.due_at);
    refreshReminders();
  } else {
    alert('Ошибка сохранения анализов');
  }
});

// Reminders
document.getElementById('refreshRemBtn').addEventListener('click', refreshReminders);

async function refreshReminders() {
  try {
    const r = await fetch('/api/reminders/upcoming?days=200');
    const { items } = await r.json();
    const list = items.map(it => (
      `<div class="rem-item">`+
      `<div><b>${it.kind}</b> — до ${it.due_at}${it.note ? ' · '+it.note : ''}</div>`+
      `<button data-id="${it.id}" class="rem-done">Выполнено</button>`+
      `</div>`
    )).join('');
    document.getElementById('reminders').innerHTML = list || '<i>Нет напоминаний</i>';
    document.querySelectorAll('.rem-done').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fd = new FormData();
        fd.append('reminder_id', btn.getAttribute('data-id'));
        const r2 = await fetch('/api/reminders/complete', { method: 'POST', body: fd });
        if (r2.ok) refreshReminders();
      });
    });
  } catch (e) {
    document.getElementById('reminders').innerHTML = '<i>Ошибка загрузки</i>';
  }
}
