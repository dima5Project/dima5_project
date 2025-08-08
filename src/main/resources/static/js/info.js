// 1) 항구명 → 위경도 (필요 시 계속 추가)
const portCoordinates = {
    "다강": { lat: 23.11, lon: 113.28 }, "황화": { lat: 31.23, lon: 121.48 },
    "롄윈강": { lat: 34.75, lon: 119.38 }, "닝보": { lat: 29.87, lon: 121.55 },
    "난징": { lat: 32.06, lon: 118.79 }, "칭다오": { lat: 36.07, lon: 120.38 },
    "르자오": { lat: 35.42, lon: 119.52 }, "상하이": { lat: 31.23, lon: 121.48 },
    "톈진": { lat: 39.08, lon: 117.20 }, "탕구싱강": { lat: 39.02, lon: 117.72 },
    "홍콩": { lat: 22.30, lon: 114.17 }, "히로시마": { lat: 34.39, lon: 132.46 },
    "하카타": { lat: 33.59, lon: 130.40 }, "이마바리": { lat: 34.07, lon: 132.99 },
    "이미즈": { lat: 36.91, lon: 137.09 }, "가고시마": { lat: 31.60, lon: 130.56 },
    "마쓰야마": { lat: 33.83, lon: 132.77 }, "모지": { lat: 33.95, lon: 130.95 },
    "나고야": { lat: 35.18, lon: 136.90 }, "나가사키": { lat: 32.75, lon: 129.87 },
    "오사카": { lat: 34.69, lon: 135.50 }, "시미즈": { lat: 35.02, lon: 138.50 },
    "도쿄": { lat: 35.68, lon: 139.76 }, "고베": { lat: 34.69, lon: 135.19 },
    "와카야마": { lat: 34.23, lon: 135.17 }, "욧카이치": { lat: 34.97, lon: 136.62 },
    "요코하마": { lat: 35.45, lon: 139.63 }, "인천": { lat: 37.45, lon: 126.60 },
    "군산": { lat: 35.97, lon: 126.71 }, "포항": { lat: 36.03, lon: 129.37 },
    "평택": { lat: 36.99, lon: 127.08 }, "여수": { lat: 34.76, lon: 127.66 },
    "마닐라": { lat: 14.60, lon: 120.98 }, "나홋카": { lat: 42.81, lon: 132.88 },
    "보스토치니": { lat: 42.74, lon: 133.05 }, "기륭": { lat: 25.13, lon: 121.74 },
    "가오슝": { lat: 22.62, lon: 120.30 }, "하이퐁": { lat: 20.86, lon: 106.68 }
};

// 2) 전역 차트 인스턴스
let congestionChart = null;

// 3) 초기 달력(공휴일 없이 오늘만 표시)
$(function init() {
    renderCalendar([]);                      // 먼저 달력 그려두기
    loadCountries();                         // 국가 목록
    wireButtons();                           // 검색/저장
});

// --------------------------------------
// 로딩 & 버튼
// --------------------------------------
function loadCountries() {
    $.get("/api/info/countries", (data = []) => {
        const $c = $("#countrySelect").empty().append(`<option disabled selected>국가 선택</option>`);
        data.forEach(cty => $c.append(`<option value="${cty}">${cty}</option>`));
    });
}

function wireButtons() {
    // 국가 선택 → 항구 목록 & 시차/공휴일
    $("#countrySelect").on("change", function () {
        const country = $(this).val();
        $("#portSelect").empty().append(`<option disabled selected>항구 선택</option>`);

        $.get(`/api/info/ports/${country}`, (data = []) => {
            data.forEach(p => $("#portSelect").append(`<option value="${p.portId}">${p.portNameKr}</option>`));
        });

        // 시차 카드
        $.get(`/api/info/timezone/${country}`, data => {
            const krTime = new Date().toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul", weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", hour12: true
            });
            $("#timezoneCard").html(`
        <h3>🕓 시차</h3>
        <div style="margin-bottom:8px"><strong>🇰🇷 한국</strong><br/>${krTime} (UTC+09:00)</div>
        <div><strong>🌍 ${data.countryName}</strong><br/>${data.dayOfWeek}, ${data.currentTime} (UTC${data.utcOffset})</div>
        `);
        });

        // 공휴일 → 달력 그리기 (없어도 달력만)
        $.get(`/api/info/holiday/${country}`, (holidays) => {
            renderCalendar(Array.isArray(holidays) ? holidays : []);
        });
    });

    // 검색 버튼 → 선택된 항구로 전체 조회
    $("#searchBtn").on("click", function () {
        const country = $("#countrySelect").val();
        const portId = $("#portSelect").val();
        const portName = $("#portSelect option:selected").text();
        if (!country || !portId) { alert("국가와 항구를 선택하세요."); return; }

        fetchWeather(portName);
        fetchDocking(portId);
        fetchDockGraph(portId);
        syncStar(portId);
    });

    // 저장(즐겨찾기) 토글 (localStorage)
    $("#saveBtn").on("click", function () {
        const portId = $("#portSelect").val();
        if (!portId) { alert("항구를 먼저 선택하세요."); return; }
        const set = new Set(JSON.parse(localStorage.getItem("favPorts") || "[]"));
        if (set.has(portId)) { set.delete(portId); } else { set.add(portId); }
        localStorage.setItem("favPorts", JSON.stringify([...set]));
        syncStar(portId);
    });
}

function syncStar(portId) {
    const set = new Set(JSON.parse(localStorage.getItem("favPorts") || "[]"));
    $("#starIcon").text(set.has(portId) ? "★" : "☆");
}

// --------------------------------------
// 데이터 조회 카드들
// --------------------------------------
function fetchWeather(portNameKr) {
    const coords = portCoordinates[portNameKr];
    if (!coords) {
        $("#weatherCard").html(`<h3>🌤 날씨</h3><p>위경도 정보가 없습니다.</p>`);
        return;
    }
    $.get("/api/info/weather/direct", { lat: coords.lat, lon: coords.lon }, data => {
        const rain = (data.rainVolume ?? 0);
        $("#weatherCard").html(`
        <h3>🌤 날씨</h3>
        <p>온도: ${data.temperature}°C</p>
        <p>날씨: ${data.mainWeather} ${data.weatherEmoji}</p>
        <p>풍속: ${data.windSpeed} m/s</p>
        <p>풍향: ${data.windDirLabel} (${data.windDeg}°)</p>
        <p>💧 강수량: ${rain} mm</p>
    `);
    });
}

function fetchDocking(portId) {
    $.get(`/api/info/docking/${portId}`, data => {
        $("#currentShips").text(data.currentShips);
        $("#expectedShips").text(data.expectedShips);

        const status = (data.congestionStatus || "원활");
        const map = { "원활": "green", "혼잡": "orange", "매우 혼잡": "red" };
        const color = map[status] || "green";
        $("#congestionLabel").text(status);
        $("#congDot").css({ background: `var(--${color})`, borderColor: `var(--${color})` });
    });
}

function fetchDockGraph(portId) {
    $.get(`/api/info/dock-graph/${portId}`, raw => {
        const labels = raw.map(d => d.date);
        const actual = raw.map(d => d.actual);
        const expected = raw.map(d => d.expected);
        drawMixedChart(labels, actual, expected);
    });
}

// --------------------------------------
// 그래프: 막대 2개 + 정박 수 실선 (막대 꼭대기 따라감)
// --------------------------------------
function drawMixedChart(labels, actual, expected) {
    const ctx = document.getElementById("congestionChart").getContext("2d");
    if (congestionChart) congestionChart.destroy();

    congestionChart = new Chart(ctx, {
        data: {
            labels,
            datasets: [
                { // 실선(정박 추이)
                    type: 'line',
                    label: '정박 추이선',
                    data: actual,
                    borderWidth: 2, pointRadius: 4, tension: .25,
                    borderColor: '#1f5bff', pointBackgroundColor: '#1f5bff', fill: false, yAxisID: 'y'
                },
                { // 정박 막대
                    type: 'bar',
                    label: '정박 선박 수',
                    data: actual,
                    backgroundColor: 'rgba(59,130,246,.35)',
                    borderColor: 'rgba(59,130,246,1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                { // 예정 막대
                    type: 'bar',
                    label: '입항 예정 수',
                    data: expected,
                    backgroundColor: 'rgba(255,159,64,.55)',
                    borderColor: 'rgba(255,159,64,1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,    // 카드 안에서 높이 고정
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: '최근 항만 혼잡도 추이' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// --------------------------------------
// 달력(공휴일 없으면 오늘만 표시)
// holidays: [{holidayDate:'2025-08-09', holidayName:'...' }, ...]
// --------------------------------------
function renderCalendar(holidays) {
    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth(), d0 = today.getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const lastDate = new Date(y, m + 1, 0).getDate();
    const holidaySet = new Set(holidays.map(h => new Date(h.holidayDate).getDate()));

    let html = `
    <h3>🎌 오늘의 공휴일</h3>
    <div style="color:var(--muted);margin-bottom:6px">${y}-${String(m + 1).padStart(2, "0")}-${String(d0).padStart(2, "0")}</div>
    <table class="calendar">
        <thead><tr>${["일", "월", "화", "수", "목", "금", "토"].map(d => `<th>${d}</th>`).join("")}</tr></thead>
        <tbody><tr>
    `;

    for (let i = 0; i < firstDay; i++) html += `<td></td>`;
    for (let d = 1; d <= lastDate; d++) {
        const isToday = d === d0;
        const isHoliday = holidaySet.has(d);
        const cls = `${isToday ? "today" : ""} ${isHoliday ? "holiday" : ""}`.trim();
        html += `<td class="${cls}">${d}</td>`;
        if ((firstDay + d) % 7 === 0) html += `</tr><tr>`;
    }
    html += `</tr></tbody></table>`;
    $("#calendarWrap").html(html);
}
