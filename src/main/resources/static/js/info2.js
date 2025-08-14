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

const portIdToName = {
    "CNDAG": "다강", "CNHUA": "황화", "CNLYG": "롄윈강", "CNNGB": "닝보", "CNNJI": "난징", "CNQDG": "칭다오", "CNRZH": "르자오", "CNSHA": "상하이", "CNTAC": "톈진", "CNTXG": "탕구싱강",
    "HKHKG": "홍콩", "JPHIJ": "히로시마", "JPHKT": "하카타", "JPIMB": "이마바리", "JPIMI": "이미즈", "JPKIJ": "가고시마", "JPMKX": "마쓰야마", "JPMOJ": "모지", "JPNGO": "나고야", "JPNGS": "나가사키",
    "JPOSA": "오사카", "JPSMZ": "시미즈", "JPTYO": "도쿄", "JPUKB": "고베", "JPWAK": "와카야마", "JPYKK": "욧카이치", "JPYOK": "요코하마",
    "KRINC": "인천", "KRKAN": "군산", "KRKPO": "포항", "KRPTK": "평택", "KRYOS": "여수",
    "PHMNL": "마닐라", "RUNJK": "나홋카", "RUVVO": "보스토치니",
    "TWKEL": "기륭", "TWKHH": "가오슝", "VNHPH": "하이퐁"
};

const portNameToCountry = {
    "다강": "중국", "황화": "중국", "롄윈강": "중국", "닝보": "중국", "난징": "중국", "칭다오": "중국", "르자오": "중국", "상하이": "중국", "톈진": "중국", "탕구싱강": "중국",
    "홍콩": "홍콩",
    "히로시마": "일본", "하카타": "일본", "이마바리": "일본", "이미즈": "일본", "가고시마": "일본", "마쓰야마": "일본", "모지": "일본", "나고야": "일본", "나가사키": "일본", "오사카": "일본", "시미즈": "일본", "도쿄": "일본", "고베": "일본", "와카야마": "일본", "욧카이치": "일본", "요코하마": "일본",
    "인천": "한국", "군산": "한국", "포항": "한국", "평택": "한국", "여수": "한국",
    "마닐라": "필리핀",
    "나홋카": "러시아", "보스토치니": "러시아",
    "기륭": "대만", "가오슝": "대만",
    "하이퐁": "베트남"
};

let congestionChart;
let autoUpdateInterval;
let isUserInteracting = false;
let currentPortId = 'CNDAG';
let currentPortNameKr = '다강';
let currentCountryNameKr = '중국';

// ==========================
// 전역 상태 변수 (달력 관련)
// ==========================
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentHolidayData = [];

// ==========================
// 자동 업데이트용 항구 목록
// ==========================
const allPortIds = Object.keys(portIdToName);


// ==========================
// 페이지 로딩 시 동작
// ==========================
$(document).ready(function () {
    initEventBindings();
    loadInitialData();
});


// ==========================
// 2. 이벤트 바인딩
// ==========================
function initEventBindings() {
    $("#countrySelect").on("change", function () {
        isUserInteracting = true;
        stopAutoUpdate();

        let countryNameKr = $(this).val();
        loadPorts(countryNameKr);
        loadTimezone(countryNameKr);
        loadHoliday(countryNameKr);
    });

    $("#searchBtn").on("click", function () {
        isUserInteracting = true;
        stopAutoUpdate();

        let portId = $("#portSelect").val();
        let portNameKr = $("#portSelect option:selected").text();

        if (!portId || portId === "항구 선택") {
            alert("항구를 선택해주세요.");
            return;
        }

        let coords = portCoordinates[portNameKr];
        if (!coords) {
            alert("선택한 항구의 좌표 정보가 없습니다.");
            return;
        }

        // 검색 시 전역 변수 업데이트
        currentPortId = portId;
        currentPortNameKr = portNameKr;
        currentCountryNameKr = $("#countrySelect").val();

        // 선택된 항구로 데이터 로드
        updateInfoCardsAndGraphs();
    });
}


// ==========================
// 3. 기능 함수들
// ==========================

// 페이지 로딩 시 초기 데이터 로드 및 자동 업데이트 시작
function loadInitialData() {
    $.get(`/api/info/port/${encodeURIComponent(currentPortId)}`, function (p) {
        currentCountryNameKr = p.countryNameKr;
        currentPortNameKr = p.portNameKr;

        loadCountries().done(() => {
            $("#countrySelect").val(currentCountryNameKr);
            // loadPorts()의 완료를 기다린 후 항구 설정
            loadPorts(currentCountryNameKr).done(() => {
                $("#portSelect").val(currentPortId);
                updateInfoCardsAndGraphs();
            });
        });

        startAutoUpdate();
    });
}

// 모든 정보 카드를 업데이트하는 공통 함수
function updateInfoCardsAndGraphs() {
    let coords = portCoordinates[currentPortNameKr];

    if (coords) {
        // 날씨
        loadWeather(coords.lat, coords.lon);
    }

    // 혼잡도 카드 + 그래프
    loadDocking(currentPortId);
    loadDockingGraph(currentPortId);
    // 시차 + 공휴일
    loadTimezone(currentCountryNameKr);
    loadHoliday(currentCountryNameKr);
}

// 자동 업데이트 중지
function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        console.log("자동 업데이트가 중지되었습니다.");
    }
}

// 자동 업데이트 시작 (10초 간격)
function startAutoUpdate() {
    if (!isUserInteracting) {
        stopAutoUpdate();

        autoUpdateInterval = setInterval(() => {
            console.log("자동 업데이트 중...");

            const randomIndex = Math.floor(Math.random() * allPortIds.length);
            const randomPortId = allPortIds[randomIndex];

            currentPortId = randomPortId;
            currentPortNameKr = portIdToName[randomPortId];
            currentCountryNameKr = portNameToCountry[currentPortNameKr];

            updateInfoCardsAndGraphs();

            $("#countrySelect").val(currentCountryNameKr);
            // loadPorts()의 완료를 기다린 후 항구 설정
            loadPorts(currentCountryNameKr).done(() => {
                $("#portSelect").val(currentPortId);
            });
        }, 10000);
    }
}

// 국가 목록
function loadCountries() {
    return $.get("/api/info/countries", function (data) {
        let $countrySelect = $("#countrySelect");
        $countrySelect.empty().append(`<option disabled selected>국가 선택</option>`);
        data.forEach(country => {
            $countrySelect.append(`<option value="${country}">${country}</option>`);
        });
    });
}

// 항구 목록
function loadPorts(countryNameKr) {
    return $.get(`/api/info/ports/${countryNameKr}`, function (data) {
        let $portSelect = $("#portSelect");
        $portSelect.empty().append(`<option disabled selected>항구 선택</option>`);
        data.forEach(port => {
            $portSelect.append(`<option value="${port.portId}">${port.portNameKr}</option>`);
        });
    });
}

// 시차 카드
function loadTimezone(countryNameKr) {
    $.get(`/api/info/timezone/${countryNameKr}`, function (data) {
        let koreaTime = new Date().toLocaleString("ko-KR", {
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
function loadHoliday(countryNameKr) {
    $.get(`/api/info/holiday/${countryNameKr}`, function (data) {
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
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let todayDate = today.getDate();
    let firstDay = new Date(currentYear, currentMonth, 1).getDay();
    let lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    let holidayDates = holidays.filter(h => {
        let hDate = new Date(h.holidayDate);
        return hDate.getFullYear() === currentYear && hDate.getMonth() === currentMonth;
    }).map(h => new Date(h.holidayDate).getDate());

    let monthTitle = `<div class="calendar-header">
 <button onclick="prevMonth()"> ◀ </button>
 <strong>${currentYear}년 ${currentMonth + 1}월</strong>
 <button onclick="nextMonth()"> ▶ </button>
    </div>`;

    let calendarHTML = `<table class="calendar-table"><thead><tr>`;
    let days = ["일", "월", "화", "수", "목", "금", "토"];
    days.forEach(d => calendarHTML += `<th>${d}</th>`);
    calendarHTML += `</tr></thead><tbody><tr>`;

    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<td></td>`;
    }

    for (let d = 1; d <= lastDate; d++) {
        let isToday = (d === todayDate && currentYear === today.getFullYear() && currentMonth === today.getMonth());
        let isHoliday = holidayDates.includes(d);

        let classes = "calendar-date";
        if (isToday) classes += " today";
        if (isHoliday) classes += " holiday";

        calendarHTML += `<td class="${classes}">
            <div class="date-number">${d}</div>`;
        if (isHoliday) {
            let holiday = holidays.find(h => new Date(h.holidayDate).getDate() === d);
            let holidayName = holiday ? holiday.holidayName : '';
            calendarHTML += `<div class="dot" title="${holidayName}"></div>`;
        }
        calendarHTML += `</td>`;

        if ((firstDay + d) % 7 === 0) {
            calendarHTML += `</tr><tr>`;
        }
    }

    calendarHTML += `</tr></tbody></table>`;
    $("#holidayCalendarContainer").html(monthTitle + calendarHTML);

    let todayText = `<strong>오늘 날짜:</strong> ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${todayDate}일 (${days[today.getDay()]})`;
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
        let rainVolume = data.rainVolume !== null ? parseFloat(data.rainVolume) : 0;
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
        let congestionText = data.congestionLevel === "혼잡" ? "혼잡"
            : data.congestionLevel === "매우 혼잡" ? "매우 혼잡"
                : "원활";

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
    let ctx = document.getElementById("graphCanvas").getContext("2d");
    let labels = data.map(d => d.date);
    let actualData = data.map(d => d.actual);
    let expectedData = data.map(d => d.expected);

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