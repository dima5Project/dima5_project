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
let calendar;

// ==========================
// 전역 상태 변수 (달력 관련)
// ==========================
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentHolidayData = [];

const month = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

const daysTag = document.querySelector('.days');
const currentDateElement = document.querySelector('.current-date');
const prevNextIcon = document.querySelectorAll('.nav button');

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

    $("body").on("click", function () {
        if (!isUserInteracting) {
            isUserInteracting = true;
            stopAutoUpdate();
        }
    });

    $("#searchBtn").on("click", function () {
        // 사용자가 선택한 항구 정보를 가져옴
        let portId = $("#portSelect").val();
        let portNameKr = portIdToName[portId];
        let coords = portCoordinates[portNameKr];

        // portId, coords 중 선택을 안 한 것이 있으면 경고창을 띄움
        if (!portId || !coords) {
            alert("국가와 항구를 모두 선택해주세요.");
            return;
        }

        // 검색 시 전역 변수 업데이트
        currentPortId = portId;
        currentPortNameKr = portNameKr;
        currentCountryNameKr = $("#countrySelect").val();

        // 선택된 항구로 데이터 로드
        updateInfoCardsAndGraphs();
    });

    // 달력 이전/다음 버튼 이벤트 리스너 추가 (가장 올바른 위치)
    prevNextIcon.forEach(icon => {
        icon.addEventListener('click', () => {
            currentMonth = icon.className.includes('left') ? currentMonth - 1 : currentMonth + 1;

            if (currentMonth < 0 || currentMonth > 11) {
                const date = new Date(currentYear, currentMonth);
                currentYear = date.getFullYear();
                currentMonth = date.getMonth();
            }

            renderCalendar(currentHolidayData); // 공휴일 데이터를 다시 전달하여 렌더링
            updateHolidayListAndToday(currentHolidayData); // 공휴일 목록도 다시 렌더링
        });
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
            loadPorts(currentCountryNameKr).done(() => {
                $("#portSelect").val(currentPortId);
                updateInfoCardsAndGraphs();
            });
        });

        startAutoUpdate();
    });
}

// 달력 렌더링 함수
function renderCalendar(holidays) {
    const today = new Date();
    const todayDate = today.getDate();

    // API에서 받은 holidayDate 문자열을 그대로 Set에 저장
    const holidayDates = new Set(holidays.map(h => h.holidayDate));

    let firstDayofMonth = new Date(currentYear, currentMonth, 1).getDay();
    let lastDateofMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let lastDateofLastMonth = new Date(currentYear, currentMonth, 0).getDate();

    let liTag = '';

    // 이전 달의 날짜들을 li에 추가
    for (let i = firstDayofMonth; i > 0; i--) {
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    // 현재 달의 날짜들을 li에 추가
    for (let i = 1; i <= lastDateofMonth; i++) {
        let classes = '';
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        // 오늘 날짜인지 확인
        if (i === todayDate && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            classes += 'active';
        }

        // 공휴일인지 확인: YYYY-MM-DD 형식으로 비교
        if (holidayDates.has(dateStr)) {
            classes += (classes.length > 0 ? ' ' : '') + 'holiday';
        }

        liTag += `<li class="${classes}">${i}</li>`;
    }

    // 다음 달의 날짜들을 li에 추가
    let lastDayofMonth = new Date(currentYear, currentMonth, lastDateofMonth).getDay();
    let remainingDays = 6 - lastDayofMonth;
    for (let i = 1; i <= remainingDays; i++) {
        liTag += `<li class="inactive">${i}</li>`;
    }

    currentDateElement.innerHTML = `${currentYear}년 ${month[currentMonth]}`;
    daysTag.innerHTML = liTag;
}

// 달력 아래에 공휴일 목록과 오늘 날짜를 표시하는 함수
function updateHolidayListAndToday(allHolidays) {
    let listContainer = $('#holidayListContainer');
    listContainer.empty();

    // 1. 오늘 날짜 정보 추가
    let today = new Date();
    let days = ["일", "월", "화", "수", "목", "금", "토"];
    let todayText = `<strong>오늘 날짜:</strong> ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${days[today.getDay()]})`;
    listContainer.append(`<p>${todayText}</p>`);

    // 2. 공휴일 목록 추가 (이번 달 공휴일만 필터링)
    let currentMonthStr = String(currentMonth + 1).padStart(2, '0');
    let currentMonthHolidays = allHolidays.filter(h => {
        // holidayDate 문자열을 직접 비교
        return h.holidayDate.startsWith(`${currentYear}-${currentMonthStr}`);
    });

    if (currentMonthHolidays.length > 0) {
        let listHTML = '<h4>이번 달 공휴일</h4><ul>';
        currentMonthHolidays.forEach(holiday => {
            const date = new Date(holiday.holidayDate);
            const day = date.getDate();
            const dayOfWeek = days[date.getDay()];
            listHTML += `<li>${day}일(${dayOfWeek}) : ${holiday.holidayName}</li>`; // 'holiday_name' 필드 사용
        });
        listHTML += '</ul>';
        listContainer.append(listHTML);
    } else {
        listContainer.append('<p>이번 달에는 공휴일이 없습니다.</p>');
    }
}

// 공휴일 + 달력
function loadHoliday(countryNameKr) {
    let requestCountryName = countryNameKr;
    if (countryNameKr === '한국') {
        requestCountryName = '대한민국';
    }

    $.get(`/api/info/holiday/${requestCountryName}`, function (data) {
        currentHolidayData = data;
        renderCalendar(data); // 달력 그리드를 렌더링
        updateHolidayListAndToday(data); // 공휴일 목록을 렌더링
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
    loadHoliday(currentCountryNameKr); // loadHoliday가 달력 렌더링을 포함
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

        // UTC 오프셋 값을 가져와서 Etc/GMT 형식에 맞게 변환
        let foreignTime;
        let foreignUtc = `UTC${data.utcOffset}`; // API 응답 그대로 사용

        // API에서 받은 data.utcOffset이 숫자인 경우를 처리
        const offsetNumber = parseFloat(data.utcOffset);
        if (!isNaN(offsetNumber)) {
            // Etc/GMT는 UTC와 부호가 반대이므로 -1을 곱함
            const gmtOffset = offsetNumber * -1;
            const timeZoneName = `Etc/GMT${gmtOffset}`;

            foreignTime = new Date().toLocaleString("ko-KR", {
                timeZone: timeZoneName,
                weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } else {
            // API 응답이 숫자가 아닌 다른 형식이면 기본값 설정
            foreignTime = "로딩 중";
        }

        $("#koreaTime").text(koreaTime);
        $("#countryName").text(data.countryName);
        $("#foreignTime").text(foreignTime);
        $("#foreignUtc").text(foreignUtc);
    });
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

        // 여기에 클래스를 추가하는 코드
        const congestionCircle = $("#congestionLevel").closest(".status-circle");
        congestionCircle.removeClass("is-congested is-very-congested is-clear");

        if (data.congestionLevel === "매우 혼잡") {
            congestionCircle.addClass("is-very-congested");
        } else if (data.congestionLevel === "혼잡") {
            congestionCircle.addClass("is-congested");
        } else {
            congestionCircle.addClass("is-clear");
        }
    });
}

// 혼잡도 그래프
function loadDockingGraph(portId) {
    $.get(`/api/info/dock-graph/${portId}`, function (data) {
        drawChart(data);
    });
}

Chart.register(ChartDataLabels);

function drawChart(data) { // 외부에서 전달받은 data를 이용해 차트를 그리는 함수
    let ctx = document.getElementById("graphCanvas").getContext("2d"); // id가 graphCanvas인 canvas 요소를 찾고, 그 위에 2d 그래픽을 그릴 수 있는 렌더링 컨텍스트(ctx)를 가져옴. 차트를 그리기 위한 도화지 역할
    let labels = data.map(d => d.date); // data 배열의 각 객체에서 date 속성만 추출하여 labels 배열을 만듦. 차트의 x축(날짜)에 사용됨.
    let actualData = data.map(d => d.actual); // data 배열에서 actual 속성(실제 정박 선박 수)을 추출하여 actualData 배열을 만듦. 정박 선박 수 데이터셋에 사용함
    let expectedData = data.map(d => d.expected); // data 배열에서 expected 속성(입항 예정 수)을 추출하여 expectedData 배열을 만듦. 입항 예정 수 데이터셋에 사용함.

    if (congestionChart) congestionChart.destroy(); // 기존에 그려진 차트 인스턴스가 있다면 파괴하여 메모리 누수 방지, 새로운 차트 그릴 준비

    congestionChart = new Chart(ctx, { // ctx(캔버스)에 새로운 차트 인스턴스를 생성하여 congestionChart 변수에 할당함.
        type: 'bar', // 차트의 기본 타입을 막대 차트로 지정
        data: { // 차트에 표시할 데이터 정의
            labels: labels, // x축에 표시될 레이블(날짜)을 위에서 준비한 labels 배열로 지정.
            datasets: [ // 차트에 들어갈 여러 데이터셋을 배열 형태로 정의.

                // 정박 선박 수 데이터 셋
                {
                    label: '정박 선박 수', // 범례와 튤팁에 표시될 데이터셋의 이름
                    data: actualData, // 해당 데이터셋이 사용할 데이터 배열
                    backgroundColor: 'rgba(149, 203, 240, 0.6)', // 막대나 선의 색상. rgba는 투명도 포함
                    borderColor: 'rgba(149, 203, 240, 1)',
                    borderWidth: 1, // 선의 두께나 막대의 두께 설정
                    hoverBorderWidth: 4, // 호버 시 외곽선 두께
                    hoverBorderColor: 'rgba(150, 150, 234, 1)',
                    order: 1, // 차트의 레이어 순서 지정. order:0은 가장 아래에 그려져 막대 뒤로 가려짐
                    pointStyle: 'circle', // 범례 아이콘을 둥근 사각형으로 설정
                    borderRadius: 20, // 막대 모서리를 5px 둥글게 함
                    yAxisID: 'y' // 이 데이터셋이 사용할 Y축의 ID 지정. 
                },

                // 정박 추이 (선) 데이터셋
                {
                    label: '정박 추이 (선)',
                    data: actualData,
                    type: 'line', // 선 차트
                    borderColor: '#47b5b5',
                    borderWidth: 2,
                    pointBackgroundColor: '#47b5b5',
                    tension: 0.3, // 선의 곡률 설정. 0.3은 약간 부드러운 곡선임.
                    fill: false,
                    order: 0,
                    yAxisID: 'y',
                    pointStyle: 'circle', // 범례 아이콘을 선으로 설정
                    datalabels: {
                        display: false
                    },
                    tooltip: { // 이 데이터셋의 툴팁을 완전히 비활성화
                        enabled: false
                    }
                },

                // 입항 예정 수 데이터 셋
                {
                    label: '입항 예정 수',
                    data: expectedData,
                    backgroundColor: 'rgba(255,177,193, 0.6)',
                    borderColor: 'rgba(255, 177, 193, 1)',
                    borderWidth: 1,
                    hoverBorderWidth: 4, // 호버 시 외곽선 두께
                    hoverBorderColor: 'rgba(150, 150, 234, 1)',
                    order: 2,
                    pointStyle: 'circle', // 범례 아이콘을 둥근 사각형으로 설정
                    borderRadius: 20, // 막대 모서리를 5px 둥글게 함
                    yAxisID: 'y1'
                }
            ]
        },

        // 차트의 모양, 동작 등을 설정하는 객체
        options: {
            responsive: true, // 캔버스 크기에 따라 차트 크기를 자동으로 조절
            maintainAspectRatio: false, // 캔버스의 가로-세로 비율을 유지하지 않도록 하여 원하는 크기로 자유롭게 조절할 수 있음

            layout: {
                padding: {
                    top: 0 // 상단 패딩 0으로 설정하여 전체 차트를 위로 올림
                }
            },

            // Chart.js 플러그인에 대한 설정
            plugins: {
                // 차트 제목 설정
                title: {
                    display: true, // 제목 보이게
                    text: '최근 항만 혼잡도 추이', // 제목 내용
                    color: '#000', // 제목 글자 색상
                    font: {
                        size: 20, // 제목 글자 크기
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 5 // 제목 아래쪽 패딩을 줄여서 범례에 더 가깝게 만듦
                    }
                },

                datalabels: {
                    anchor: 'end', // 숫자를 막대의 끝 부분에 표시
                    align: 'top', // 숫자를 막대 위쪽에 정렬
                    formatter: function (value, context) {
                        // 데이터 값만 표시하도록 포맷팅
                        return value;
                    },
                    font: {
                        size: 12,
                    },
                    color: '#333', // 숫자 색상
                    offset: -7, // 숫자를 막대 안쪽으로 -10px 이동하여 더 가깝게 함
                    padding: {
                        top: 5 // 상단 패딩을 줄여 간격 좁힘
                    }
                },

                tooltip: {
                    mode: 'nearest', // 마우스에 가장 가까운 단일 데이터셋만 툴팁에 표시
                    intersect: false // 가까우면 툴팁 표시
                },

                legend: {
                    labels: {
                        usePointStyle: true,
                        padding: 10 // 범례 항목 간의 간격 조정
                    },
                    position: 'top', // 범례 위치
                }
            },

            // 차트의 축에 대한 설정
            scales: {
                // x축에 대한 설정
                x: {
                    barPercentage: 0.3, // 막대 너비를 60%로 줄여서 얇게 함
                    categoryPercentage: 0.5 // 카테고리 내에서 막대가 차지하는 비율을 70%로 줄여 막대 간 간격을 넓힘
                },

                // y축에 대한 설정
                y: {
                    type: 'linear', // y축의 스케일 타입을 linear로 지정
                    display: true,
                    position: 'left', // 왼쪽 y축
                    beginAtZero: true, // y축이 0부터 시작하도록 설정하여 데이터가 왜곡되어 보이지 않게 함
                    title: {
                        display: true,
                        text: '정박 선박 수' // 왼쪽 y축 제목
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right', // 오른쪽 y축
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false // 오른쪽 y축의 그리드 라인 비활성화
                    },
                    title: {
                        display: true,
                        text: '입항 예정 수' // 오른쪽 y축 제목
                    }
                }
            }
        }
    });
}

// 선택 항구의 맵박스
document.addEventListener("DOMContentLoaded", async () => {
    // 1. URL에서 portId 가져오기
    const params = new URLSearchParams(window.location.search);
    const portId = params.get('port');

    if (!portId) {
        console.error("URL에 portId가 없습니다.");
        return;
    }

    try {
        // 2. portId로 항구 정보 가져오기 (메인 페이지에서 사용했던 API 재활용)
        const res = await fetch(`/api/info/hover/${encodeURIComponent(portId)}`);
        if (!res.ok) throw new Error('hover API 실패');
        const portInfo = await res.json();

        // 3. 위도, 경도 정보 추출
        const lat = portInfo.latitude;
        const lng = portInfo.longitude;

        if (!lat || !lng) {
            console.error("API 응답에 유효한 위도/경도 정보가 없습니다.");
            return;
        }

        // 4. Mapbox 지도 초기화
        mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ';

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [lng, lat], // 해당 항구 중심으로 설정
            zoom: 12, // 항구 하나만 보이도록 줌 레벨 조정
            attributionControl: false
        });

        // 5. 지도에 마커 추가
        new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .addTo(map);

    } catch (e) {
        console.error("데이터 로딩 또는 지도 초기화 실패:", e);
    }
});
