/****************************************
 * 0) 전역 설정 (시점/지도/팝업 상태)
 ****************************************/
// 예: 예측 로직에서 정해준 '시점 시간'을 여기에 넣어두고 호버시 사용
window.currentSelectedTimeHour = 14; // 5, 11, 14, 17, ... 필요 시 바꿔주기

const hoverState = {
    locationReq: null,  // jqXHR
    oceanReq: null,     // jqXHR
    popup: null
};

/****************************************
 * 1) 항구 좌표 사전 → GeoJSON 변환
 ****************************************/
// UN/LOCODE(또는 portId) 키와 좌표를 모두 여기에 등록
// 1) 항구 좌표 사전
const portCoordinates = {
    CNDAG: { lon: 121.79, lat: 38.98 },
    CNHUA: { lon: 113.5142, lat: 23.0612 },
    CNLYG: { lon: 119.22, lat: 34.6 },
    CNNGB: { lon: 121.54, lat: 29.87 },
    CNNJI: { lon: 119.061, lat: 32.192 },
    CNQDG: { lon: 120.32, lat: 36.07 },
    CNRZH: { lon: 119.53, lat: 35.36 },
    CNSHA: { lon: 121.61, lat: 31.37 },
    CNTAC: { lon: 121.19, lat: 31.63 },
    CNTXG: { lon: 117.74, lat: 38.98 },
    HKHKG: { lon: 113.93, lat: 22.35 },
    JPHIJ: { lon: 132.42, lat: 34.35 },
    JPHKT: { lon: 130.4, lat: 33.6 },
    JPIMB: { lon: 133, lat: 34.07 },
    JPIMI: { lon: 129.88, lat: 33.26 },
    JPKIJ: { lon: 139.2001, lat: 37.9432 },
    JPMKX: { lon: 133.53, lat: 34 },
    JPMOJ: { lon: 130.96, lat: 33.94 },
    JPNGO: { lon: 136.872277, lat: 35.10909491 },
    JPNGS: { lon: 129.88, lat: 32.75 },
    JPOSA: { lon: 135.48, lat: 34.66 },
    JPSMZ: { lon: 138.5, lat: 35 },
    JPTYO: { lon: 139.78, lat: 35.58 },
    JPUKB: { lon: 135.18, lat: 34.67 },
    JPWAK: { lon: 135.17, lat: 34.23 },
    JPYKK: { lon: 136.62, lat: 34.95 },
    JPYOK: { lon: 139.62, lat: 35.42 },
    KRINC: { lon: 126.68, lat: 37.45 },
    KRKAN: { lon: 127.7, lat: 34.94 },
    KRKPO: { lon: 129.4, lat: 36.02 },
    KRPTK: { lon: 126.84, lat: 36.96 },
    KRYOS: { lon: 127.66, lat: 34.76 },
    PHMNL: { lon: 120.97, lat: 14.57 },
    RUNJK: { lon: 132.92, lat: 42.84 },
    RUVVO: { lon: 131.89, lat: 43.09 },
    TWKEL: { lon: 121.74, lat: 25.13 },
    TWKHH: { lon: 120.32, lat: 22.55 },
    VNHPH: { lon: 106.7, lat: 20.85 }
};

// 2) GeoJSON 변환
function buildPortsGeoJSON(dict) {
    return {
        type: "FeatureCollection",
        features: Object.entries(dict).map(([portId, v]) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [v.lon, v.lat] },
            properties: { portId }
        }))
    };
}

// 3) 사용 예시
const portsGeoJSON = buildPortsGeoJSON(portCoordinates);
console.log(portsGeoJSON);


/****************************************
 * 2) 유틸
 ****************************************/
// 오늘 날짜 + KST 시각 → UTC ISO 문자열 (timeseries 매칭용)
function kstHourToISO(kstHour) {
    const d = new Date();
    d.setHours(kstHour, 0, 0, 0);
    return d.toISOString();
}
function toWeatherEmoji(symbol) {
    if (!symbol) return "❓";
    if (symbol.includes("clearsky")) return "☀️";
    if (symbol.includes("partlycloudy")) return "⛅";
    if (symbol.includes("cloudy")) return "☁️";
    if (symbol.includes("lightrain")) return "🌦️";
    if (symbol.includes("rain")) return "🌧️";
    if (symbol.includes("snow")) return "🌨️";
    if (symbol.includes("thunder")) return "⛈️";
    if (symbol.includes("fog")) return "🌫️";
    return "🌡️";
}
function degToCompass8(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(((deg % 360) / 45)) % 8];
}
function pickClosestLocation(js, targetISO) {
    const target = new Date(targetISO);
    const series = js?.properties?.timeseries || [];
    let closest = null, min = Infinity;
    for (const s of series) {
        const diff = Math.abs(new Date(s.time) - target);
        if (diff < min) { min = diff; closest = s; }
    }
    if (!closest) return null;
    const d = closest.data.instant.details || {};
    const sym = closest.data.next_1_hours?.summary?.symbol_code;
    return {
        airTempC: d.air_temperature,
        windMS: d.wind_speed,
        windFromDeg: d.wind_from_direction,
        emoji: toWeatherEmoji(sym),
        visibilityHint: (d.fog_area_fraction != null)
            ? (d.fog_area_fraction > 0 ? "안개 가능(≤1km)" : "양호")
            : "정보없음"
    };
}
function pickClosestOcean(js, targetISO) {
    const target = new Date(targetISO);
    const series = js?.properties?.timeseries || [];
    let closest = null, min = Infinity;
    for (const s of series) {
        const diff = Math.abs(new Date(s.time) - target);
        if (diff < min) { min = diff; closest = s; }
    }
    if (!closest) return null;
    const d = closest.data.instant.details || {};
    return {
        waveHeightM: d.sea_surface_wave_height,
        waveFromDeg: d.sea_surface_wave_from_direction,
        currentMS: d.sea_water_speed,
        currentToDeg: d.sea_water_to_direction,
        sstC: d.sea_water_temperature
    };
}
function buildEnvPopupHTML(env) {
    if (!env) return "<div>데이터 없음</div>";
    const num = (v, f = 1) => (v == null || isNaN(v)) ? "-" : Number(v).toFixed(f);
    return `
    <div style="font:12px/1.4 -apple-system,Segoe UI,Arial">
        <div><strong>기온</strong> ${num(env.airTempC, 1)}°C ${env.emoji || ""}</div>
        <div><strong>바람</strong> ${num(env.windMS, 1)} m/s (${degToCompass8(env.windFromDeg)}에서)</div>
        <div><strong>가시거리</strong> ${env.visibilityHint || "-"}</div>
        <div><strong>파고</strong> ${num(env.waveHeightM, 1)} m (${degToCompass8(env.waveFromDeg)})</div>
        <div><strong>해류</strong> ${num(env.currentMS, 2)} m/s (${degToCompass8(env.currentToDeg)})</div>
        <div><strong>해수온</strong> ${num(env.sstC, 1)} °C</div>
    </div>`;
}
function debounce(fn, wait = 180) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}
function abortInFlight() {
    try { hoverState.locationReq?.abort(); } catch (e) { }
    try { hoverState.oceanReq?.abort(); } catch (e) { }
    hoverState.locationReq = null;
    hoverState.oceanReq = null;
}

/****************************************
 * 3) AJAX (요청 1개 = 함수 1개)
 ****************************************/
function ajaxMetLocation(lat, lon) {
    // 반환값: jqXHR (필요 시 .then(...) 체인)
    return $.ajax({
        url: "/proxy/met/location",
        method: "GET",
        data: { lat, lon },
        dataType: "json"
    });
}
function ajaxMetOcean(lat, lon) {
    return $.ajax({
        url: "/proxy/met/ocean",
        method: "GET",
        data: { lat, lon },
        dataType: "json"
    });
}

/****************************************
 * 4) Mapbox: 항구 레이어 추가 + 호버 바인딩
 ****************************************/
function addPortLayer(map) {
    const portsGeo = buildPortsGeoJSON(portCoordinates);
    if (!map.getSource("ports")) {
        map.addSource("ports", { type: "geojson", data: portsGeo });
    } else {
        map.getSource("ports").setData(portsGeo);
    }
    if (!map.getLayer("port-points-layer")) {
        map.addLayer({
            id: "port-points-layer",
            type: "circle",
            source: "ports",
            paint: {
                "circle-radius": 6,
                "circle-color": "#1e90ff",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#ffffff"
            }
        });
    }
    bindHoverForPortLayer(map, "port-points-layer");
}

function bindHoverForPortLayer(map, layerId) {
    map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
        abortInFlight();
        hoverState.popup?.remove();
        hoverState.popup = null;
    });

    const onMove = debounce(function (e) {
        const f = e.features && e.features[0];
        if (!f) return;

        // 좌표는 GeoJSON geometry에서 직접 사용
        const coords = f.geometry && f.geometry.coordinates;
        if (!coords || coords.length < 2) return;
        const lon = Number(coords[0]);
        const lat = Number(coords[1]);

        // 항구별 time을 쓰고 싶으면 properties.time을 넣고, 없으면 전역값 사용
        const timeHour = Number(f.properties?.time ?? window.currentSelectedTimeHour);
        if (isNaN(timeHour)) return;

        const targetISO = kstHourToISO(timeHour);

        // 기존 요청 취소
        abortInFlight();

        // 날씨/해양 각각 1요청 (= 2요청 병렬)
        hoverState.locationReq = ajaxMetLocation(lat, lon);
        hoverState.oceanReq = ajaxMetOcean(lat, lon);

        $.when(hoverState.locationReq, hoverState.oceanReq)
            .then((locRes, oceanRes) => {
                // jQuery $.when의 then 콜백 인자는 [data, status, jqXHR] 형태로 들어옴
                const locJs = locRes && locRes[0];
                const oceanJs = oceanRes && oceanRes[0];
                const locEnv = pickClosestLocation(locJs, targetISO);
                const ocEnv = pickClosestOcean(oceanJs, targetISO);
                const env = { ...locEnv, ...ocEnv };

                const html = buildEnvPopupHTML(env);
                hoverState.popup?.remove();
                hoverState.popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
                    .setLngLat([lon, lat])
                    .setHTML(html)
                    .addTo(map);
            })
            .fail(err => {
                // abort()면 silent
                if (err && err.statusText === "abort") return;
                hoverState.popup?.remove();
                hoverState.popup = null;
                console.error("항구 호버 환경 조회 실패:", err);
            });
    }, 180);

    map.on("mousemove", layerId, onMove);
}

/****************************************
 * 5) 초기화 예시 (필요한 곳에서 호출)
 ****************************************/
mapboxgl.accessToken = "pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ";
const map = new mapboxgl.Map('{ ... }');
map.on("load", function () {
    addPortLayer(map); // 항구 레이어 생성 + 호버 바인딩
});

// 시점 변경 시(예: 다른 버튼/토글로 17시 선택) → 전역값만 갱신
window.currentSelectedTimeHour = 17;
