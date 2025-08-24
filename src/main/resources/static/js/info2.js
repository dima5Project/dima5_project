(() => {
    if (!document.querySelector('.extra-info-container')) return;

    // ==========================
    // 0) 상수/맵
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
    const allPortIds = Object.keys(portIdToName);

    // ==========================
    // 1) 전역 상태
    // ==========================
    let congestionChart;
    let autoUpdateInterval = null;
    let isUserInteracting = false;

    let currentPortId = "CNDAG";
    let currentPortName = portIdToName[currentPortId];   // ex) 다강
    let currentCountry = portNameToCountry[currentPortName];

    let infoMap, infoMarker;

    // 달력 상태 (HTML 구조: .nav 버튼 / .current-date / .days)
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0=1월
    let currentHolidayData = [];
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    const daysTag = document.querySelector('.days');
    const currentDateElement = document.querySelector('.current-date');
    const prevNextIcon = document.querySelectorAll('.nav button');

    // 플러그인 등록
    if (window.ChartDataLabels) {
        Chart.register(ChartDataLabels);
    }

    const legendGapPlugin = {
        id: 'legendGap',
        beforeInit(chart, args, opts) {
            const fit = chart.legend.fit;
            chart.legend.fit = function fitWithGap() {
                fit.call(this);
                this.height += (opts && opts.gap) ? opts.gap : 12; // 원하는 간격(px)
            };
        }
    };
    Chart.register(legendGapPlugin);

    // 지도 토큰
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ';

    const MAP_DEFAULT_ZOOM = 3;
    const MAP_FOCUS_ZOOM = window.matchMedia('(max-width: 768px)').matches ? 8 : 9;


    // ==========================
    // 2) 유틸
    // ==========================
    const getQueryPortFromURL = () => {
        const q = new URLSearchParams(location.search).get('port');
        return (q && portIdToName[q]) ? q : null;
    };

    function toggleSearchBtn() {
        const ok = !!($("#countrySelect").val() && $("#portSelect").val());
        $("#searchBtn").prop("disabled", !ok);
    }

    function stopAutoUpdate() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
            autoUpdateInterval = null;
            console.log("[auto] stopped");
        }
    }
    function startAutoUpdate() {
        if (isUserInteracting) return; // 이미 사용자 상호작용 발생 시 금지
        stopAutoUpdate();
        autoUpdateInterval = setInterval(() => {
            if (isUserInteracting) { stopAutoUpdate(); return; }

            // 무작위 포트 순환
            const ridx = Math.floor(Math.random() * allPortIds.length);
            currentPortId = allPortIds[ridx];
            currentPortName = portIdToName[currentPortId];
            currentCountry = portNameToCountry[currentPortName];

            // 정보 갱신 (지도/카드/그래프/달력/시차)
            updateInfoCardsAndGraphs(currentCountry, currentPortId, currentPortName);

            // 셀렉트박스는 “어떤 항구인지 알려주기” 용도로만 동기화 (이벤트 트리거 X)
            $("#countrySelect").val(currentCountry);
            loadPorts(currentCountry).done(() => {
                $("#portSelect").val(currentPortId);
                toggleSearchBtn();
            });
        }, 10000);
    }

    // 스크롤 제외: 클릭/포인터/키 입력 1회라도 들어오면 자동 순환 중단
    (function attachAutoStopOnce() {
        if (window.__autoStopGuardsAttached) return;
        window.__autoStopGuardsAttached = true;

        const stopOnce = () => { if (!isUserInteracting) { isUserInteracting = true; stopAutoUpdate(); } };
        window.addEventListener('pointerdown', stopOnce, { once: true, passive: true, capture: true });
        window.addEventListener('click', stopOnce, { once: true, passive: true, capture: true });
        window.addEventListener('touchstart', stopOnce, { once: true, passive: true, capture: true });
        window.addEventListener('keydown', stopOnce, { once: true, capture: true });
    })();

    // ==========================
    // 3) 초기 바인딩
    // ==========================
    $(document).ready(function () {
        ensureMap([127, 37.5], MAP_DEFAULT_ZOOM);

        initEventBindings();
        loadInitialData();
        toggleSearchBtn();

        // 달력 Prev/Next
        prevNextIcon.forEach(btn => {
            btn.addEventListener('click', () => {
                currentMonth = btn.className.includes('left') ? currentMonth - 1 : currentMonth + 1;
                if (currentMonth < 0 || currentMonth > 11) {
                    const d = new Date(currentYear, currentMonth);
                    currentYear = d.getFullYear();
                    currentMonth = d.getMonth();
                }
                renderCalendar(currentHolidayData);
                updateHolidayListAndToday(currentHolidayData);
            });
        });
    });

    function initEventBindings() {
        $("#countrySelect").on("change", function () {
            // 수동 모드 전환
            isUserInteracting = true; stopAutoUpdate();

            const country = $(this).val();
            loadPorts(country).done(() => {
                $("#portSelect").val("");    // 새 국가 선택 시 항구 placeholder로 리셋
                toggleSearchBtn();
            });
        });

        $("#portSelect").on("change", toggleSearchBtn);

        // $("#portSelect").on("change", function () {
        //     isUserInteracting = true; stopAutoUpdate();
        //     toggleSearchBtn();
        // });

        $("#searchBtn").on("click", function () {
            // 반드시 버튼을 눌러야만 포트별 정보 로드되도록!
            const country = $("#countrySelect").val();
            const portId = $("#portSelect").val();
            if (!country || !portId) {
                alert("국가와 항구를 모두 선택해주세요.");
                return;
            }
            isUserInteracting = true; stopAutoUpdate();

            const portName = portIdToName[portId];
            currentCountry = country;
            currentPortId = portId;
            currentPortName = portName;

            updateInfoCardsAndGraphs(currentCountry, currentPortId, currentPortName);
        });
    }

    // ==========================
    // 4) 초기 로딩 흐름
    // ==========================
    function loadInitialData() {
        const urlPortId = getQueryPortFromURL();

        if (urlPortId) {
            // (A) 예측 페이지에서 포트 클릭해 진입: 그 포트로 고정, 자동순환 없음
            isUserInteracting = true; stopAutoUpdate();

            $.get(`/api/info/port/${encodeURIComponent(urlPortId)}`, function (p) {
                // p: { countryNameKr, portNameKr, ... }
                currentPortId = urlPortId;
                currentPortName = p.portNameKr || portIdToName[urlPortId];
                currentCountry = p.countryNameKr || portNameToCountry[currentPortName];

                // 셀렉트 로딩 후 값 반영
                loadCountries().done(() => {
                    $("#countrySelect").val(currentCountry);
                    loadPorts(currentCountry).done(() => {
                        $("#portSelect").val(currentPortId);
                        toggleSearchBtn();
                        updateInfoCardsAndGraphs(currentCountry, currentPortId, currentPortName);
                    });
                });
            });

        } else {
            // (B) 네비게이션에서 직접 진입: 기본 포트로 즉시 조회 + 10초 자동순환
            $.get(`/api/info/port/${encodeURIComponent(currentPortId)}`, function (p) {
                currentPortName = p.portNameKr || currentPortName;
                currentCountry = p.countryNameKr || currentCountry;

                loadCountries().done(() => {
                    $("#countrySelect").val(currentCountry);
                    loadPorts(currentCountry).done(() => {
                        $("#portSelect").val(currentPortId);
                        toggleSearchBtn();

                        // 초기 1회 조회
                        updateInfoCardsAndGraphs(currentCountry, currentPortId, currentPortName);
                        // 자동순환 시작
                        startAutoUpdate();
                    });
                });
            });
        }
    }

    // ==========================
    // 5) 데이터 로더
    // ==========================
    function loadCountries() {
        const $c = $("#countrySelect");
        $c.prop("disabled", true)
            .html('<option value="" disabled selected hidden>국가 선택</option>');

        return $.get("/api/info/countries", function (list) {
            list.forEach(name => $c.append(`<option value="${name}">${name}</option>`));
            $c.prop("disabled", false).val("");   // <-- placeholder 상태 유지
        });
    }

    function loadPorts(country) {
        const $p = $("#portSelect");
        $p.prop("disabled", true)
            .html('<option value="" disabled selected hidden>항구 선택</option>');

        return $.get(`/api/info/ports/${encodeURIComponent(country)}`, function (list) {
            list.forEach(port => $p.append(`<option value="${port.portId}">${port.portNameKr}</option>`));
            $p.prop("disabled", false).val("");   // <-- placeholder 상태 유지
        });
    }

    function setPrettyKoTime($el, tz) {
        const now = new Date();
        const fmtDate = new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz
        });
        const fmtTime = new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
        });
        const fmtWeek = new Intl.DateTimeFormat('ko-KR', {
            weekday: 'short', timeZone: tz
        });

        const dateStr = fmtDate.format(now);
        const dateWithDot = dateStr.endsWith('.') ? dateStr : (dateStr + '.'); // ‘2025. 08. 19.’

        const timeStr = fmtTime.format(now);   // ‘20:39’
        const weekStr = fmtWeek.format(now);   // ‘화’, ‘수’ …

        // 줄바꿈 포함
        $el.html(`${dateWithDot}<br>${timeStr} (${weekStr})`);
    }

    function loadTimezone(country) {
        $.get(`/api/info/timezone/${country}`, function (data) {
            // 한국(고정)
            setPrettyKoTime($("#koreaTime"), "Asia/Seoul");

            // 해외(응답의 UTC 오프셋 사용)
            // 예: data.utcOffset === "+09:00" 또는 "9" 등 -> Etc/GMT 표기 맞춰 변환
            const n = parseFloat(data.utcOffset); // 분 단위 오프셋이 온다면 반올림/절사 필요
            let foreignTz = "UTC";
            if (!isNaN(n)) {
                const gmtOffset = n * -1;              // Etc/GMT는 부호가 반대
                foreignTz = `Etc/GMT${gmtOffset === 0 ? '' : (gmtOffset > 0 ? '+' + gmtOffset : gmtOffset)}`;
                setPrettyKoTime($("#foreignTime"), foreignTz);
            } else {
                $("#foreignTime").text("로딩 중");
            }

            // 라벨/UTC 표시는 그대로
            $("#countryName").text(data.countryName);
            $("#foreignUtc").text(`UTC${data.utcOffset}`);
        });
    }

    function loadHoliday(country) {
        const req = (country === '한국') ? '대한민국' : country;
        $.get(`/api/info/holiday/${req}`, function (data) {
            currentHolidayData = Array.isArray(data) ? data : [];
            renderCalendar(currentHolidayData);
            updateHolidayListAndToday(currentHolidayData);
        });
    }

    function loadWeatherByName(portName) {
        const c = portCoordinates[portName];
        if (!c) return;
        $.get("/api/info/weather/direct", { lat: c.lat, lon: c.lon }, function (data) {
            let rainVolume = parseFloat(data.rainVolume);
            if (isNaN(rainVolume)) rainVolume = 0;
            $("#temperature").text(data.temperature + "°C");
            $("#mainWeather").text(data.mainWeather + " " + data.weatherEmoji);
            $("#windSpeed").text(data.windSpeed + " m/s");
            $("#windDirLabel").text(data.windDirLabel + " (" + data.windDeg + "°)");
            $("#rainVolume").text(rainVolume + " mm");
        });
    }

    function loadDocking(portId) {
        $.get(`/api/info/docking/${portId}`, function (data) {
            const txt = data.congestionLevel === "매우 혼잡" ? "매우 혼잡"
                : data.congestionLevel === "혼잡" ? "혼잡"
                    : "원활";
            $("#currentShips").text(data.currentShips);
            $("#expectedShips").text(data.expectedShips);
            $("#congestionLevel").text(txt);

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

    function loadDockingGraph(portId) {
        $.get(`/api/info/dock-graph/${portId}`, function (data) {
            if (!Array.isArray(data) || data.length === 0) { console.warn("dock-graph empty"); return; }
            drawChart(data);
        });
    }

    // ==========================
    // 6) 공통 갱신 (지도 포함)
    // ==========================
    function updateInfoCardsAndGraphs(countryNameKr, portId, portNameKr) {
        // 날씨(좌표 매핑) + 혼잡도 + 그래프 + 시차 + 공휴일
        loadWeatherByName(portNameKr);
        loadDocking(portId);
        loadDockingGraph(portId);
        loadTimezone(countryNameKr);
        loadHoliday(countryNameKr);

        // 지도
        updateMapByPortId(portId, portNameKr);
    }

    // ==========================
    // 7) 지도(Mapbox)
    // ==========================
    function ensureMap(center = [127, 37.5], zoom = MAP_DEFAULT_ZOOM) {
        if (infoMap) return;
        infoMap = new mapboxgl.Map({
            container: 'infoMap',
            style: 'mapbox://styles/mapbox/light-v11',
            center, zoom,
            attributionControl: false
        });
        infoMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
        infoMap.on('load', () => infoMap.resize());

        // 커스텀 마커 생성
        const el = document.createElement('div');
        el.className = 'port-marker';
        infoMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' });
    }

    async function updateMapByPortId(portId, portNameKr) {
        ensureMap();

        let lat = null, lng = null;
        try {
            const res = await fetch(`/api/info/hover/${encodeURIComponent(portId)}`);
            if (res.ok) {
                const info = await res.json();
                lat = parseFloat(info.latitude);
                lng = parseFloat(info.longitude);
            }
        } catch (e) { console.error('hover API 실패:', e); }

        // 좌표 폴백
        if ((isNaN(lat) || isNaN(lng)) && portCoordinates[portNameKr]) {
            lat = portCoordinates[portNameKr].lat;
            lng = portCoordinates[portNameKr].lon;
        }
        if (isNaN(lat) || isNaN(lng)) return;

        infoMarker.setLngLat([lng, lat]).addTo(infoMap);
        infoMap.easeTo({ center: [lng, lat], zoom: MAP_FOCUS_ZOOM, duration: 800 });
    }

    // ==========================
    // 8) 차트
    // ==========================
    function drawChart(data) {
        const ctx = document.getElementById("graphCanvas").getContext("2d");

        // TS → "MM/DD HH:mm" 통합 포맷터 (ISO, epoch(ms|sec), "YYYY-MM-DD HH:mm[:ss]" 모두 커버)
        const fmtTS = (v) => {
            if (v == null) return null;
            let d;
            if (typeof v === "number") {
                d = new Date(v > 1e12 ? v : v * 1000); // sec → ms
            } else {
                const s = String(v).trim();
                // "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ss"
                d = new Date(s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s);
                if (isNaN(d)) return null;
            }
            // 로컬타임으로 표기 (원하면 timeZone 옵션 지정)
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mi = String(d.getMinutes()).padStart(2, "0");
            return `${mm}/${dd} ${hh}:${mi}`;
        };

        // 라벨: timestamp 우선 사용, 없으면 date 폴백
        const labels = data.map(d => {
            const ts = d.timeStamp ?? d.time_stamp ?? d.timestamp ?? d.time ?? null;
            return fmtTS(ts) ?? (d.date ?? "—");
        });

        const toNum = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };
        const actual = data.map(d => toNum(d.actual ?? d.currentShips ?? d.current_ships ?? d.current));
        const expect = data.map(d => toNum(d.expected ?? d.expectedShips ?? d.expected_ ?? d.exp));

        if (window.congestionChart) window.congestionChart.destroy();

        window.congestionChart = new Chart(ctx, {
            type: 'bar', // 차트의 기본 타입을 막대 차트로 지정
            data: { // 차트에 표시할 데이터 정의
                labels: labels, // x축에 표시될 레이블(날짜)을 위에서 준비한 labels 배열로 지정.
                datasets: [ // 차트에 들어갈 여러 데이터셋을 배열 형태로 정의.

                    // 정박 선박 수 데이터 셋
                    {
                        label: '정박 선박 수', // 범례와 튤팁에 표시될 데이터셋의 이름
                        data: actual, // 해당 데이터셋이 사용할 데이터 배열
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
                        data: actual,
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
                        data: expect,
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
                            bottom: 0
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
                            padding: 20 // 범례 항목 간의 간격 조정
                        },
                        position: 'top', // 범례 위치
                        align: 'center'
                    },

                    legendGap: {
                        gap: 18
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

    // ==========================
    // 9) 달력(현재 HTML 구조용)
    // ==========================
    function renderCalendar(holidays) {
        const today = new Date();
        const todayDate = today.getDate();

        const holidayDatesSet = new Set(holidays.map(h => h.holidayDate));
        let firstDayofMonth = new Date(currentYear, currentMonth, 1).getDay();
        let lastDateofMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let lastDateofLastMon = new Date(currentYear, currentMonth, 0).getDate();

        let li = '';
        for (let i = firstDayofMonth; i > 0; i--) {
            li += `<li class="inactive">${lastDateofLastMon - i + 1}</li>`;
        }
        for (let d = 1; d <= lastDateofMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let cls = '';
            if (d === todayDate && currentMonth === today.getMonth() && currentYear === today.getFullYear()) cls += 'active';
            if (holidayDatesSet.has(dateStr)) cls += (cls ? ' ' : '') + 'holiday';
            li += `<li class="${cls}">${d}</li>`;
        }
        let lastDayofMonth = new Date(currentYear, currentMonth, lastDateofMonth).getDay();
        for (let i = 1; i <= (6 - lastDayofMonth); i++) {
            li += `<li class="inactive">${i}</li>`;
        }

        currentDateElement.innerHTML = `${currentYear}년 ${monthNames[currentMonth]}`;
        daysTag.innerHTML = li;
    }

    function updateHolidayListAndToday(allHolidays) {
        const $list = $('#holidayListContainer');
        $list.empty();

        // const today = new Date();
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        // const todayText = `<strong>오늘 날짜:</strong> ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${days[today.getDay()]})`;
        // $list.append(`<p>${todayText}</p>`);

        const monStr = String(currentMonth + 1).padStart(2, '0');
        const thisMon = allHolidays.filter(h => h.holidayDate.startsWith(`${currentYear}-${monStr}`));
        if (thisMon.length) {
            let html = '<h4>이번 달 공휴일</h4><ul>';
            thisMon.forEach(h => {
                const d = new Date(h.holidayDate);
                html += `<li><span class="holiColor">${d.getDate()}일(${days[d.getDay()]})</span> : ${h.holidayName}</li>`;
            });
            html += '</ul>';
            $list.append(html);
        } else {
            $list.append('<p>이번 달에는 공휴일이 없습니다.</p>');
        }
    }

})();