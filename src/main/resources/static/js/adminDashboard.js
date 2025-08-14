(function () {
    let userTypeChart;
    let weeklySignupChart;

    // ====== 1. 사용자 유형 도넛 ======
    async function loadUserType() {
        const res = await fetch('/api/admin/userTypeCounts');
        const data = await res.json(); // [{userType: "화주", count: 5}, ...]

        const labels = data.map(d => d.userType);
        const values = data.map(d => d.count);

        if (userTypeChart) userTypeChart.destroy();
        userTypeChart = new Chart(document.getElementById('userTypeChart'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'] // 필요 시 색상 변경
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                cutout: '60%'
            }
        });
    }

    // ====== 2. 월별 주차 가입자 막대 ======
    async function loadWeeklySignups(weeks = 12) {
        const res = await fetch(`/api/admin/weeklySignups?weeks=${weeks}`);
        const data = await res.json(); // [{monthWeek: '08월 1주', count: 12}, ...]

        const labels = data.map(d => d.monthWeek);
        const values = data.map(d => d.count);

        if (weeklySignupChart) weeklySignupChart.destroy();
        weeklySignupChart = new Chart(document.getElementById('weeklySignupChart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: '가입 수',
                    data: values,
                    backgroundColor: '#4e73df'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // ====== 3. 최근 문의 리스트 ======
    async function loadRecentAsks() {
        const res = await fetch('/api/admin/recentask?limit=10');
        const data = await res.json();
        renderAskList(data);
    }

    function renderAskList(items) {
        const list = document.getElementById('askList');
        list.innerHTML = '';

        if (!items.length) {
            list.innerHTML = '<div class="ask-item muted">문의가 없습니다.</div>';
            return;
        }

        items.forEach(it => {
            const time = (it.createDate || '').replace('T', ' ');
            list.innerHTML += `
        <div class="ask-item">
          <div class="title">${escapeHtml(it.title)}</div>
          <div class="meta">${escapeHtml(it.writer)} · ${time}</div>
        </div>
      `;
        });
    }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    // ====== 4. 실시간 문의 알림 (SSE) ======
    function connectSSE() {
        const es = new EventSource('/api/admin/asks/stream');
        es.addEventListener('init', () => console.log('[SSE] 연결됨'));

        es.addEventListener('ask-new', (ev) => {
            const payload = JSON.parse(ev.data);
            showToast(`새 문의: ${payload.title}`);
            prependAsk(payload);
        });

        es.onerror = () => {
            console.warn('[SSE] 오류, 3초 후 재연결');
            es.close();
            setTimeout(connectSSE, 3000);
        };
    }

    function prependAsk(payload) {
        const list = document.getElementById('askList');
        const time = (payload.createDate || '').replace('T', ' ');
        const html = `
      <div class="ask-item">
        <div class="title">${escapeHtml(payload.title)}</div>
        <div class="meta">${escapeHtml(payload.writer)} · ${time}</div>
      </div>
    `;
        list.insertAdjacentHTML('afterbegin', html);
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ====== 초기 실행 ======
    loadUserType();
    loadWeeklySignups(12);
    loadRecentAsks();
    connectSSE();

})();
