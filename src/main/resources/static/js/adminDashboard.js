(function () {
    let userTypeChart;
    let weeklySignupChart;
    let es; // SSE 인스턴스(단일)

    // ===== 공통 fetch =====
    async function getJson(url) {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} on ${url}: ${txt.slice(0, 120)}`);
        }
        return res.json();
    }

    // ===== 유틸 =====
    function formatDate(iso) {
        return iso ? String(iso).replace("T", " ").split(".")[0] : "";
    }
    function escapeHtml(s) {
        return String(s || "").replace(/[&<>"']/g, (m) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
        );
    }
    function showToast(msg, duration = 4500) {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(t._hideTimer);
        t._hideTimer = setTimeout(() => t.classList.remove("show"), duration);
    }

    // ===== 1) 사용자 유형 도넛 =====
    async function loadUserType() {
        const data = await getJson("/api/admin/usertype"); // [{userType,count}]
        const labels = data.map((d) => d.userType);
        const values = data.map((d) => d.count);

        if (userTypeChart) userTypeChart.destroy();
        userTypeChart = new Chart(document.getElementById("userTypeChart"), {
            type: "doughnut",
            data: { labels, datasets: [{ data: values }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 150,
                plugins: { legend: { position: "bottom" } },
                cutout: "60%",
            },
        });
    }

    // ===== 2) 월별 주차 가입자 막대 =====
    async function loadWeeklySignups(weeks = 12) {
        const data = await getJson(`/api/admin/weekly?weeks=${weeks}`); // [{monthWeek,count}]
        const labels = data.map((d) => d.monthWeek);
        const values = data.map((d) => d.count);

        if (weeklySignupChart) weeklySignupChart.destroy();
        weeklySignupChart = new Chart(document.getElementById("weeklySignupChart"), {
            type: "bar",
            data: { labels, datasets: [{ label: "가입 수", data: values }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 150,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
            },
        });
    }

    // ===== 3) 최근 문의 표 =====
    async function loadRecentAsks(limit = 20) {
        const data = await getJson(`/api/admin/asks/recent?limit=${limit}`);
        renderAskTable(data);
    }

    function renderAskTable(items) {
        const tbody = document.getElementById("askTableBody");
        const empty = document.getElementById("askEmpty");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (!items || !items.length) {
            if (empty) empty.hidden = false;
            return;
        }
        if (empty) empty.hidden = true;

        items.forEach((it) => {
            const time = formatDate(it.createDate);
            tbody.insertAdjacentHTML(
                "beforeend",
                `
        <tr>
          <td>${it.askSeq ?? "-"}</td>
          <td class="ellipsis">${escapeHtml(it.title)}</td>
          <td>${escapeHtml(it.writer)}</td>
          <td>${time}</td>
        </tr>
      `
            );
        });
    }

    // 새 문의 행을 맨 위에 추가
    function prependRow(it) {
        const tbody = document.getElementById("askTableBody");
        const empty = document.getElementById("askEmpty");
        if (!tbody) return;
        if (empty) empty.hidden = true;

        const time = formatDate(it.createDate);
        tbody.insertAdjacentHTML(
            "afterbegin",
            `
      <tr>
        <td>${it.askSeq ?? "-"}</td>
        <td class="ellipsis">${escapeHtml(it.title)}</td>
        <td>${escapeHtml(it.writer)}</td>
        <td>${time}</td>
      </tr>
    `
        );
    }

    // ===== 4) 문의 로그 패널 =====
    async function loadLog() {
        const data = await getJson("/api/admin/asks/recent?limit=100");
        const ul = document.getElementById("logList");
        const empty = document.getElementById("logEmpty");
        ul.innerHTML = "";

        if (!data.length) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        data.forEach((it) => {
            const answered = !!it.replyStatus;
            ul.insertAdjacentHTML(
                "beforeend",
                `
        <li class="adm-logitem ${answered ? "answered" : "unread"}" data-ask="${it.askSeq}">
          <span class="badge ${answered ? "badge-done" : "badge-new"}">
            ${answered ? "답변" : "신규"}
          </span>
          <div>
            <div class="title ellipsis">${escapeHtml(it.title)}</div>
            <div class="meta">${escapeHtml(it.writer)} · ${formatDate(it.createDate)}</div>
          </div>
        </li>
      `
            );
        });
    }

    async function refreshUnansweredDot() {
        try {
            const { count } = await getJson("/api/admin/asks/unanswered-count");
            const dot = document.getElementById("noticeDot");
            if (dot) dot.style.display = count > 0 ? "inline-block" : "none";
        } catch (e) {
            /* ignore */
        }
    }

    // -------- 로그 항목 즉시 상태 변경 도우미 --------
    function markAskAsAnswered(askSeq) {
        const li = document.querySelector(`.adm-logitem[data-ask="${askSeq}"]`);
        if (!li) return;
        li.classList.remove("unread");
        li.classList.add("answered");
        const badge = li.querySelector(".badge");
        if (badge) {
            badge.textContent = "답변";
            badge.classList.remove("badge-new");
            badge.classList.add("badge-done");
        }
    }

    // ===== 5) SSE (단일 연결) =====
    function connectSSE() {
        if (es) es.close();
        es = new EventSource("/api/admin/asks/stream");

        es.addEventListener("init", () => console.log("[SSE] 연결됨"));

        es.addEventListener("ask-new", async (ev) => {
            const payload = JSON.parse(ev.data);
            showToast(`새 문의: ${payload.title}`, 8000);
            prependRow(payload);
            const dot = document.getElementById("noticeDot");
            if (dot) dot.style.display = "inline-block"; // 즉시 켜기
            await refreshUnansweredDot(); // 서버 집계 반영
            if (document.getElementById("askLogPanel")?.classList.contains("open")) {
                loadLog().catch(console.error);
            }
        });

        es.addEventListener("ask-replied", async (ev) => {
            try {
                const p = JSON.parse(ev.data || "{}"); // { askSeq, ... }
                if (p.askSeq) markAskAsAnswered(p.askSeq); // 즉시 DOM 갱신
            } catch { }
            await refreshUnansweredDot();
            if (document.getElementById("askLogPanel")?.classList.contains("open")) {
                loadLog().catch(console.error);
            }
        });

        es.onerror = () => {
            console.warn("[SSE] 오류, 3초 후 재연결");
            es.close();
            setTimeout(connectSSE, 3000);
        };
    }

    // ===== 6) 이벤트 바인딩 & 초기 로드 =====
    document.getElementById("weeksSelect")?.addEventListener("change", (e) => {
        loadWeeklySignups(Number(e.target.value || 12)).catch(console.error);
    });

    document.getElementById("refreshAsk")?.addEventListener("click", () =>
        loadRecentAsks(20).catch(console.error)
    );

    // === 열기/닫기 로직 ===
    const drawer = document.getElementById("askLogPanel");
    const overlay = document.getElementById("drawerOverlay");
    const askBtn = document.getElementById("askBtn");
    const closeBtn = document.getElementById("closeLog");

    async function openDrawer() {
        try {
            await Promise.all([loadLog(), refreshUnansweredDot()]);
        } finally {
            drawer?.classList.add("open");
            overlay?.classList.add("show");
            drawer?.setAttribute("aria-hidden", "false");
            document.body.classList.add("no-scroll");
        }
    }

    function closeDrawer() {
        drawer?.classList.remove("open");
        overlay?.classList.remove("show");
        drawer?.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
    }

    askBtn?.addEventListener("click", openDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    overlay?.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer?.classList.contains("open")) closeDrawer();
    });

    // 로그 항목 클릭 → 상세/답변 페이지 이동
    document.getElementById("logList")?.addEventListener("click", (e) => {
        const li = e.target.closest(".adm-logitem");
        if (!li) return;
        const askSeq = li.dataset.ask;
        window.location.href = `/admin/asks/${askSeq}`;
    });

    // 초기 실행
    document.addEventListener("DOMContentLoaded", () => {
        loadUserType().catch(console.error);
        loadWeeklySignups(12).catch(console.error);
        loadRecentAsks().catch(console.error);
        refreshUnansweredDot().catch(console.error);
        connectSSE();
    });
})();
