$(document).ready(function () {
    const $container = $("#port-container");
    const $select = $("#countrySelect");

    // -------------------------------
    // 1. 국가 리스트 불러오기
    // -------------------------------
    $.ajax({
        url: "/api/info/countries",
        method: "GET",
        success: function (countryList) {
            if (!Array.isArray(countryList)) {
                console.error("국가 리스트가 배열이 아님:", countryList);
                return;
            }

            $select.append(`<option value="all">전체</option>`);
            countryList.forEach(function (country) {
                $select.append(`<option value="${country}">${country}</option>`);
            });
        },
        error: function (err) {
            console.error("국가 리스트 가져오기 오류:", err);
        }
    });

    // -------------------------------
    // 2. 항구 정보 불러오기
    // -------------------------------
    function loadPortInfo(country = "all") {
        const url = country === "all" ? "/api/info/all" : `/api/info/country/${country}`;

        $.ajax({
            url: url,
            method: "GET",
            success: function (data) {
                if (!Array.isArray(data)) {
                    console.error("항구 데이터가 배열이 아님:", data);
                    return;
                }

                $container.empty();

                data.forEach(function (port) {
                    const portNameDTO = port.portNameDTO || {};
                    const weather = port.weather || {};
                    const holiday = port.holiday || {};

                    const portName = `${portNameDTO.portNameKr || "알 수 없음"} (${portNameDTO.countryNameKr || "알 수 없음"})`;
                    const latitude = (portNameDTO.locLat !== undefined) ? portNameDTO.locLat.toFixed(4) : "정보 없음";
                    const longitude = (portNameDTO.locLon !== undefined) ? portNameDTO.locLon.toFixed(4) : "정보 없음";

                    const weatherMain = weather.mainWeather || "정보 없음";
                    const emoji = weather.weatherEmoji || "";
                    const temp = (weather.temperature !== undefined) ? `${weather.temperature}°C` : "정보 없음";

                    const time = port.timezoneNow || "정보 없음";
                    const congestion = port.docking || "정보 없음";
                    const holidayName = holiday.holidayName || "해당일 없음";

                    const cardHtml = `
                        <div class="port-card">
                            <h2>${portName}</h2>
                            <p><strong>위치:</strong> 위도 ${latitude}, 경도 ${longitude}</p>
                            <p><strong>날씨:</strong> ${weatherMain} ${emoji} (${temp})</p>
                            <p><strong>현지 시각:</strong> ${time}</p>
                            <p><strong>항만 혼잡도:</strong> ${congestion}</p>
                            <p><strong>오늘 공휴일:</strong> ${holidayName}</p>
                        </div>
                    `;
                    $container.append(cardHtml);
                });
            },
            error: function (err) {
                console.error("항구 정보 불러오기 실패:", err);
            }
        });
    }

    // 최초 전체 항구 정보 로드
    loadPortInfo();

    // -------------------------------
    // 3. 국가 변경 시 필터링
    // -------------------------------
    $select.on("change", function () {
        const selectedCountry = $(this).val();
        loadPortInfo(selectedCountry);
    });
});
