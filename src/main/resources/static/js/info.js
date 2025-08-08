// ✅ 1. 항구명 기반 위경도 정의
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

let congestionChart;

$(document).ready(function () {
    const $countrySelect = $("#countrySelect");
    const $portSelect = $("#portSelect");

    // ① 국가 목록
    $.get("/api/info/countries", function (data) {
        $countrySelect.empty().append(`<option disabled selected>국가 선택</option>`);
        data.forEach(country => {
            $countrySelect.append(`<option value="${country}">${country}</option>`);
        });
    });

    // ② 국가 선택 시
    $countrySelect.on("change", function () {
        const selectedCountry = $(this).val();
        $portSelect.empty().append(`<option disabled selected>항구 선택</option>`);

        // 항구 목록
        $.get(`/api/info/ports/${selectedCountry}`, function (data) {
            data.forEach(port => {
                $portSelect.append(`<option value="${port.portId}">${port.portNameKr}</option>`);
            });
        });

        // 시차 정보
        $.get(`/api/info/timezone/${selectedCountry}`, function (data) {
            const koreaTime = new Date().toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
                weekday: 'long',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            $("#timezoneCard").html(`
                <h3>🕓 시차 정보</h3>
                <div style="margin-bottom:10px;">
                    <strong>한국</strong><br/>
                    ${koreaTime} (UTC+09:00)
                </div>
                <br><hr><br>
                <div>
                    <strong> ${data.countryName}</strong><br/>
                    ${data.dayOfWeek}, ${data.currentTime} (UTC${data.utcOffset})
                </div>
            `);
        });

        // 공휴일
        $.get(`/api/info/holiday/${selectedCountry}`, function (data) {
            if (data && Array.isArray(data) && data.length > 0) {
                drawHolidayCalendar(data);
            } else {
                $("#holidayCard").html(`
                    <h3>오늘의 공휴일</h3>
                    <p>등록된 공휴일이 없습니다.</p>
                `);
            }
        });

        // 이전에 등록된 이벤트 제거 후 재등록
        $portSelect.off("change").on("change", function () {
            const portId = $(this).val();
            const portNameKr = $(this).find("option:selected").text();
            const coords = portCoordinates[portNameKr];

            // 날씨
            if (coords) {
                $.get("/api/info/weather/direct", { lat: coords.lat, lon: coords.lon }, function (data) {
                    let rainVolume = parseFloat(data.rainVolume);
                    if (isNaN(rainVolume)) rainVolume = 0;

                    $("#weatherCard").html(`
                        <h3>🌤 날씨</h3>
                        <p>온도: ${data.temperature}°C</p>
                        <p>날씨: ${data.mainWeather} ${data.weatherEmoji}</p>
                        <p>풍속: ${data.windSpeed} m/s</p>
                        <p>풍향: ${data.windDirLabel} (${data.windDeg}°)</p>
                        <p>💧 강수량: ${rainVolume} mm</p>
                    `);
                });
            } else {
                $("#weatherCard").html(`<p>위경도 정보가 없습니다.</p>`);
            }

            // 혼잡도 카드
            $.get(`/api/info/docking/${portId}`, function (data) {
                const colorText = data.congestionStatus === "혼잡" ? "🟠 혼잡"
                    : data.congestionStatus === "매우 혼잡" ? "🔴 매우 혼잡"
                        : "🟢 원활";

                $("#dockingCard").html(`
                    <h3>⚓ 혼잡도</h3>
                    <p>정박 선박 수: ${data.currentShips}</p>
                    <p>입항 예정 수: ${data.expectedShips}</p>
                    <p>상태: ${colorText}</p>
                `);
            });

            // 혼잡도 그래프
            $.get(`/api/info/dock-graph/${portId}`, function (data) {
                drawChart(data);
            });
        });
    });

    // ③ 혼합 그래프 (bar + line)
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
                        yAxisID: 'y',
                        order: 2
                    },
                    {
                        label: '입항 예정 수',
                        data: expectedData,
                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                        order: 2
                    },
                    {
                        label: '정박 추이선',
                        data: actualData,
                        type: 'line',
                        borderColor: 'blue',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'blue',
                        tension: 0.4,
                        yAxisID: 'y',
                        order: 1
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
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '선박 수'
                        }
                    }
                }
            }
        });
    }

    // ④ 공휴일 달력
    function drawHolidayCalendar(holidays) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed
        const todayDate = today.getDate();

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const holidayDates = holidays.map(h => new Date(h.holidayDate).getDate());

        let calendarHTML = `<table><thead><tr>`;
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        days.forEach(d => calendarHTML += `<th>${d}</th>`);
        calendarHTML += `</tr></thead><tbody><tr>`;

        for (let i = 0; i < firstDay; i++) {
            calendarHTML += `<td></td>`;
        }

        for (let d = 1; d <= lastDate; d++) {
            let cell = "";

            const isToday = d === todayDate;
            const isHoliday = holidayDates.includes(d);

            if (isToday && isHoliday) {
                cell = `<div style="background-color:#ffefef; border-radius:50%; padding:4px;">⭕●</div>`;
            } else if (isToday) {
                cell = `<div style="background-color:#ffe0e0; border-radius:50%; padding:4px;">⭕</div>`;
            } else if (isHoliday) {
                cell = `<div style="color:red;">●</div>`;
            } else {
                cell = d;
            }

            calendarHTML += `<td style="text-align:center">${cell}</td>`;

            if ((firstDay + d) % 7 === 0) {
                calendarHTML += `</tr><tr>`;
            }
        }

        calendarHTML += `</tr></tbody></table>`;

        // 달력 렌더링
        $("#holidayCalendarContainer").html(calendarHTML);

        // 오늘 날짜 텍스트 추가
        const todayText = `${year}년 ${month + 1}월 ${todayDate}일 (${days[today.getDay()]})`;
        $("#todayText").html(`<p style="margin-bottom: 10px;"><strong>📅 오늘 날짜:</strong> ${todayText}</p>`);
    }

    drawHolidayCalendar([]); // 그냥 기본 달력 출력
});
