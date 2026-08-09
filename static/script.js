const STATUS_LABELS = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadEverything();
});

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });
}

function typeLine(text, el, speed = 28) {
  let i = 0;
  el.textContent = '';
  const tick = () => {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(tick, speed);
    }
  };
  tick();
}

async function loadEverything() {
  const [tutor, jobs, applications, stats] = await Promise.all([
    fetchJSON('/api/tutor'),
    fetchJSON('/api/jobs'),
    fetchJSON('/api/applications'),
    fetchJSON('/api/stats'),
  ]);

  renderTerminalLine(tutor, stats);
  renderHeader(tutor);
  renderStats(stats);
  renderCharts(stats);
  renderJobs(jobs);
  renderApplications(applications);
  renderProfile(tutor, stats);
}

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Request failed: ' + url);
  return res.json();
}

function renderTerminalLine(tutor, stats) {
  const el = document.getElementById('termLine');
  const first = tutor.name.split(' ')[0];
  typeLine(
    `whoami: ${first} · ${stats.open_jobs} open jobs · ${stats.total_applications} applications tracked`,
    el
  );
}

function renderHeader(tutor) {
  document.getElementById('tutorFirstName').textContent = tutor.name.split(' ')[0];
  document.getElementById('tutorHeadline').textContent = tutor.headline;
}

function renderStats(stats) {
  const cards = [
    { num: stats.open_jobs, label: 'Open jobs' },
    { num: stats.total_applications, label: 'Applications sent' },
    { num: stats.status_counts.accepted, label: 'Accepted' },
    { num: stats.acceptance_rate + '%', label: 'Acceptance rate' },
  ];
  const grid = document.getElementById('statGrid');
  grid.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="num">${c.num}</div>
      <div class="label">${c.label}</div>
    </div>
  `).join('');
}

function renderCharts(stats) {
  const mint = '#8fbfb0';
  const yellow = '#fbc02d';
  const red = '#e57373';
  const dim = '#a9b3a6';
  const gridColor = 'rgba(169,179,166,0.15)';

  new Chart(document.getElementById('statusChart'), {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Accepted', 'Rejected'],
      datasets: [{
        data: [stats.status_counts.pending, stats.status_counts.accepted, stats.status_counts.rejected],
        backgroundColor: [yellow, mint, red],
        borderColor: '#1F2E24',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: dim, font: { family: 'IBM Plex Mono', size: 11 } } } },
      cutout: '65%',
    },
  });

  const timeline = stats.applications_timeline;
  const labels = timeline.map(t => t.date.slice(5));
  const cumulative = timeline.map((_, i) => i + 1);

  new Chart(document.getElementById('timelineChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Applications',
        data: cumulative,
        borderColor: mint,
        backgroundColor: 'rgba(143,191,160,0.15)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: yellow,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: dim, font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: gridColor } },
        y: { ticks: { color: dim, font: { family: 'IBM Plex Mono', size: 10 }, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
      },
    },
  });
}

function renderJobs(jobs) {
  const grid = document.getElementById('jobGrid');
  grid.innerHTML = jobs.map(j => `
    <div class="job-card">
      <span class="tag">${j.subject}</span>
      <h4 style="margin: 8px 0;">${j.level} · ${j.mode}</h4>
      <div class="meta" style="color:var(--text-dim); font-size:0.85rem;">${j.location} · ${j.frequency} · posted ${j.posted}</div>
      <p class="desc" style="margin: 10px 0; font-size:0.9rem;">${j.description}</p>
      <div class="foot">
        <span class="rate">$${j.rate}/hr</span>
        <button class="btn" data-job="${j.id}" ${j.applied ? 'disabled' : ''}>
          ${j.applied ? 'Applied' : 'Apply'}
        </button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('button[data-job]').forEach(btn => {
    btn.addEventListener('click', () => applyToJob(btn));
  });
}

async function applyToJob(btn) {
  const jobId = Number(btn.dataset.job);
  btn.disabled = true;
  btn.textContent = 'Applying…';
  try {
    await fetchJSON('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    });
    btn.textContent = 'Applied';
    const [applications, stats] = await Promise.all([fetchJSON('/api/applications'), fetchJSON('/api/stats')]);
    renderApplications(applications);
    renderStats(stats);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Apply';
  }
}

function renderApplications(applications) {
  const list = document.getElementById('appList');
  if (!applications.length) {
    list.innerHTML = `<p style="color:var(--text-dim)">No applications yet — head to the Job Board to apply.</p>`;
    return;
  }
  list.innerHTML = applications
    .slice()
    .reverse()
    .map(a => `
      <div class="app-row">
        <div class="info">
          <h4>${a.subject} · ${a.level}</h4>
          <span style="font-size:0.85rem; color:var(--text-dim);">Applied ${a.applied} · $${a.rate}/hr</span>
        </div>
        <span class="stamp ${a.status}">${STATUS_LABELS[a.status] || a.status}</span>
      </div>
    `).join('');
}

function renderProfile(tutor, stats) {
  const card = document.getElementById('profileCard');
  card.innerHTML = `
    <h2>${tutor.name}</h2>
    <div style="color:var(--chalk-mint); margin-bottom:10px;">${tutor.headline}</div>
    <div style="color:var(--chalk-yellow);">★ ${tutor.rating} (${tutor.reviews} reviews)</div>
    <p style="margin: 15px 0;">${tutor.bio}</p>
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
      ${tutor.subjects.map(s => `<span class="tag">${s}</span>`).join('')}
    </div>
    <div class="grid-stats">
      <div class="stat-card"><div class="num">${tutor.students_taught}</div><div class="label">Students Taught</div></div>
      <div class="stat-card"><div class="num">${tutor.hours_taught}</div><div class="label">Hours Taught</div></div>
      <div class="stat-card"><div class="num">$${tutor.hourly_rate}</div><div class="label">Hourly Rate</div></div>
    </div>
  `;
}