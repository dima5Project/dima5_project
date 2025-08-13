// ==========================
// 1. 공통 설정
// ==========================
const portCoordinates = {
    "다강": { lat: 23.11, lon: 113.28 },
    "황화": { lat: 31.23, lon: 121.48 },
    "롄윈강": { lat: 34.75, lon: 119.38 },
    "닝보": { lat: 29.87, lon: 121.55 },
    "난징": { lat: 32.06, lon: 118.79 },
    "칭다오": { lat: 36.07, lon: 120.38 },
    "르자오": { lat: 35.42, lon: 119.52 },
    "상하이": { lat: 31.23, lon: 121.48 },
    "톈진": { lat: 39.08, lon: 117.20 },
    "탕구싱강": { lat: 39.02, lon: 117.72 },
    "홍콩": { lat: 22.30, lon: 114.17 },
    "히로시마": { lat: 34.39, lon: 132.46 },
    "하카타": { lat: 33.59, lon: 130.40 },
    "이마바리": { lat: 34.07, lon: 132.99 },
    "이미즈": { lat: 36.91, lon: 137.09 },
    "가고시마": { lat: 31.60, lon: 130.56 },
    "마쓰야마": { lat: 33.83, lon: 132.77 },
    "모지": { lat: 33.95, lon: 130.95 },
    "나고야": { lat: 35.18, lon: 136.90 },
    "나가사키": { lat: 32.75, lon: 129.87 },
    "오사카": { lat: 34.69, lon: 135.50 },
    "시미즈": { lat: 35.02, lon: 138.50 },
    "도쿄": { lat: 35.68, lon: 139.76 },
    "고베": { lat: 34.69, lon: 135.19 },
    "와카야마": { lat: 34.23, lon: 135.17 },
    "욧카이치": { lat: 34.97, lon: 136.62 },
    "요코하마": { lat: 35.45, lon: 139.63 },
    "인천": { lat: 37.45, lon: 126.60 },
    "군산": { lat: 35.97, lon: 126.71 },
    "포항": { lat: 36.03, lon: 129.37 },
    "평택": { lat: 36.99, lon: 127.08 },
    "여수": { lat: 34.76, lon: 127.66 },
    "마닐라": { lat: 14.60, lon: 120.98 },
    "나홋카": { lat: 42.81, lon: 132.88 },
    "보스토치니": { lat: 42.74, lon: 133.05 },
    "기륭": { lat: 25.13, lon: 121.74 },
    "가오슝": { lat: 22.62, lon: 120.30 },
    "하이퐁": { lat: 20.86, lon: 106.68 }
};

let congestionChart; // 그래프 표시 위한 선언

// ==========================
// 전역 상태 변수 (달력 관련)
// ==========================
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0부터 시작 (0 = 1월)
let currentHolidayData = []; // 현재 달 공휴일 목록 캐시


// ==========================
// 페이지 로딩 시 동작
// ==========================
$(document).ready(function () {
    initEventBindings(); // 전체 이벤트 바인딩
    loadCountries(); // 처음 국가 목록 불러오기
    drawHolidayCalendar([]);

    initPortFromQuery();
});

// ==========================
// 2. 이벤트 바인딩
// ==========================
function initEventBindings() {
    $("#countrySelect").on("change", function () {
        const country = $(this).val();
        console.log('country changed:', this.value);
        loadPorts(country);
        loadTimezone(country);
        loadHoliday(country);
    });

    $("#searchBtn").on("click", function () {
        const portId = $("#portSelect").val();
        const portNameKr = $("#portSelect option:selected").text();
        const coords = portCoordinates[portNameKr];

        if (!portId || !coords) {
            alert("국가와 항구를 모두 선택해주세요.");
            return;
        }

        // 날씨
        loadWeather(coords.lat, coords.lon);

        // 혼잡도 카드 + 그래프
        loadDocking(portId);
        loadDockingGraph(portId);
    });
}

// ==========================
// 3. 기능 함수들
// ==========================

// [ADDED] ✅ 딥링크 초기화: /port/info?port={portId}로 진입했을 때 자동 세팅
function initPortFromQuery() {
    const params = new URLSearchParams(location.search);
    const portId = params.get('port');
    if (!portId) return;

    // 1) 포트 기본 정보 조회 (한글 국가/항구명 + 좌표 확보)
    $.get(`/api/info/port/${encodeURIComponent(portId)}`, function (p) {
        // p: { portId, countryNameKr, portNameKr, locLat, locLon, ... }

        // 2) 국가 목록 로딩이 끝나면 해당 국가 선택
        const waitCountries = setInterval(() => {
            const $country = $("#countrySelect");
            if ($country.children('option').length > 0) {
                clearInterval(waitCountries);
                $country.val(p.countryNameKr).trigger('change');

                // 3) 항구 목록 로딩이 끝나면 해당 항구 선택
                const waitPorts = setInterval(() => {
                    const $opt = $(`#portSelect option[value='${portId}']`);
                    if ($opt.length) {
                        clearInterval(waitPorts);
                        $("#portSelect").val(portId);

                        // 4) 카드/그래프 로딩
                        const coords = portCoordinates[p.portNameKr]; // 좌표 직접 관리 중이면 이렇게
                        if (coords) {
                            loadWeather(coords.lat, coords.lon);
                        } else if (p.locLat && p.locLon) {
                            loadWeather(p.locLat, p.locLon);
                        }
                        loadDocking(portId);
                        loadDockingGraph(portId);
                        loadTimezone(p.countryNameKr);
                        loadHoliday(p.countryNameKr);
                    }
                }, 50);
            }
        }, 50);
    });
}

// 국가 목록
function loadCountries() {
    $.get("/api/info/countries", function (data) {
        const $countrySelect = $("#countrySelect");
        $countrySelect.empty().append(`<option disabled selected>국가 선택</option>`);
        data.forEach(country => {
            $countrySelect.append(`<option value="${country}">${country}</option>`);
        });
    });
}

// 항구 목록
function loadPorts(country) {
    $.get(`/api/info/ports/${country}`, function (data) {
        const $portSelect = $("#portSelect");
        $portSelect.empty().append(`<option disabled selected>항구 선택</option>`);
        data.forEach(port => {
            $portSelect.append(`<option value="${port.portId}">${port.portNameKr}</option>`);
        });
    });
}

// 시차 카드
function loadTimezone(country) {
    $.get(`/api/info/timezone/${country}`, function (data) {
        const koreaTime = new Date().toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        $("#koreaTime").text(koreaTime);
        $("#countryName").text(data.countryName);
        $("#foreignTime").text(`${data.dayOfWeek}, ${data.currentTime}`);
        $("#foreignUtc").text(`UTC${data.utcOffset}`);
    });
}
// 공휴일 + 달력
function loadHoliday(country) {
    $.get(`/api/info/holiday/${country}`, function (data) {
        if (Array.isArray(data) && data.length > 0) {
            currentHolidayData = data;
            drawHolidayCalendar(data);
        } else {
            currentHolidayData = [];
            drawHolidayCalendar([]);
        }
    });
}
function drawHolidayCalendar(holidays) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const todayDate = today.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const holidayDates = holidays.map(h => new Date(h.holidayDate).getDate());

    // 월 이동 UI (HTML 템플릿)
    const monthTitle = `<div class="calendar-header">
 <button onclick="prevMonth()"> ◀ </button>
 <strong>${currentYear}년 ${currentMonth + 1}월</strong>
 <button onclick="nextMonth()"> ▶ </button>
    </div>`;

    let calendarHTML = `<table class="calendar-table"><thead><tr>`;
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    days.forEach(d => calendarHTML += `<th>${d}</th>`);
    calendarHTML += `</tr></thead><tbody><tr>`;

    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<td></td>`;
    }

    for (let d = 1; d <= lastDate; d++) {
        const isToday = d === todayDate;
        const isHoliday = holidayDates.includes(d);

        let classes = "calendar-date";
        if (isToday) classes += " today";
        if (isHoliday) classes += " holiday";

        calendarHTML += `<td class="${classes}">${d}`;
        if (isHoliday) {
            calendarHTML += `<div class="dot"></div>`;
        }
        calendarHTML += `</td>`;

        if ((firstDay + d) % 7 === 0) {
            calendarHTML += `</tr><tr>`;
        }
    }

    calendarHTML += `</tr></tbody></table>`;
    $("#holidayCalendarContainer").html(monthTitle + calendarHTML);

    const todayText = `<strong>오늘 날짜:</strong> ${year}년 ${month + 1}월 ${todayDate}일 (${days[today.getDay()]})`;
    $("#todayText").html(`<p>${todayText}</p>`);
}

// 이전 / 다음 달 이동 함수
function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    drawHolidayCalendar(currentHolidayData);
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    drawHolidayCalendar(currentHolidayData);
}

// 날씨 카드
function loadWeather(lat, lon) {
    $.get("/api/info/weather/direct", { lat, lon }, function (data) {
        let rainVolume = parseFloat(data.rainVolume);
        if (isNaN(rainVolume)) rainVolume = 0;

        $("#temperature").text(data.temperature + "°C");
        $("#mainWeather").text(data.mainWeather + " " + data.weatherEmoji);
        $("#windSpeed").text(data.windSpeed + " m/s");
        $("#windDirLabel").text(data.windDirLabel + " (" + data.windDeg + "°)");
        $("#rainVolume").text(rainVolume + " mm");
    });
}

// 혼잡도 카드
function loadDocking(portId) {
    $.get(`/api/info/docking/${portId}`, function (data) {
        const congestionText = data.congestionLevel === "혼잡" ? "🟠 혼잡"
            : data.congestionLevel === "매우 혼잡" ? "🔴 매우 혼잡"
                : "🟢 원활";

        $("#currentShips").text(data.currentShips);
        $("#expectedShips").text(data.expectedShips);
        $("#congestionLevel").text(congestionText);
    });
}

// 혼잡도 그래프
function loadDockingGraph(portId) {
    $.get(`/api/info/dock-graph/${portId}`, function (data) {
        drawChart(data);
    });
}

function drawChart(data) {
    const ctx = document.getElementById("graphCanvas").getContext("2d");
    const labels = data.map(d => d.date);
    const actualData = data.map(d => d.actual);
    const expectedData = data.map(d => d.expected);

    if (congestionChart) congestionChart.destroy();

    congestionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '정박 선박 수',
                    data: actualData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    order: 1,
                    yAxisID: 'y'
                },
                {
                    label: '정박 추이 (선)',
                    data: actualData,
                    type: 'line',
                    borderColor: 'blue',
                    borderWidth: 2,
                    pointBackgroundColor: 'blue',
                    tension: 0.3,
                    fill: false,
                    order: 0,
                    yAxisID: 'y'
                },
                {
                    label: '입항 예정 수',
                    data: expectedData,
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    order: 2,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '최근 항만 혼잡도 추이'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}