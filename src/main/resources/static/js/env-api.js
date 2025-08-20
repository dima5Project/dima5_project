/* ============================
   env-api.js (Open‑Meteo 버전)
   - 해양: Marine API (/v1/marine)
   - 날씨: Forecast API (/v1/forecast)
   - 팝업 카드: buildEnvPopupHTML
   ============================ */

// ---- 호출기 ----
function ajaxMarine(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
        timeformat: 'iso8601',
        // 필요한 변수만 최소 호출
        hourly: [
            'wave_height',
            'wave_direction',
            'sea_surface_temperature',
            'ocean_current_velocity',
            'ocean_current_direction'
        ].join(',')
        // NOTE: Marine API의 속도 단위 파라미터는 문서 확인 후 사용 권장.
        //       불확실하면 생략(기본 단위 사용)하는 편이 안전합니다.
        // e.g.) current_speed_unit=ms (문서 확정 시)
    }).toString();

    return $.ajax({
        url: `https://marine-api.open-meteo.com/v1/marine?${params}`,
        method: 'GET',
        dataType: 'json',
        cache: false
    });
}

function ajaxWeather(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
        timeformat: 'iso8601',
        hourly: [
            'temperature_2m',
            'wind_speed_10m',
            'wind_direction_10m',
            'visibility',
            'weather_code'
        ].join(','),
        wind_speed_unit: 'ms' // m/s로 통일
    }).toString();

    return $.ajax({
        url: `https://api.open-meteo.com/v1/forecast?${params}`,
        method: 'GET',
        dataType: 'json',
        cache: false
    });
}

// ---- 유틸 ----
function _safeISO(targetISO) {
    // targetISO가 비었거나 파싱 불가하면 now로 대체
    const t = targetISO ? new Date(targetISO) : new Date();
    return isNaN(t.getTime()) ? new Date().toISOString() : t.toISOString();
}

function _closestIndex(isoArray, targetISO) {
    if (!Array.isArray(isoArray) || isoArray.length === 0) return 0;
    const t = new Date(_safeISO(targetISO)).getTime();
    let best = 0, md = Infinity;
    for (let i = 0; i < isoArray.length; i++) {
        const ti = new Date(isoArray[i]).getTime();
        if (isNaN(ti)) continue;
        const d = Math.abs(ti - t);
        if (d < md) { md = d; best = i; }
    }
    return best;
}

function _num(v, f = 1) {
    return (v == null || isNaN(v)) ? null : Number(v).toFixed(f);
}

// Open‑Meteo WMO weather_code 간단 맵 (이모지/텍스트)
function weatherCodeToTextEmoji(code) {
    const c = Number(code);
    if ([0].includes(c)) return { txt: '맑음', emoji: '☀️' };
    if ([1, 2, 3].includes(c)) return { txt: '구름 조금~많음', emoji: '⛅' };
    if ([45, 48].includes(c)) return { txt: '안개', emoji: '🌫️' };
    if ([51, 53, 55, 56, 57].includes(c)) return { txt: '이슬비/얼음이슬비', emoji: '🌦️' };
    if ([61, 63, 65].includes(c)) return { txt: '비', emoji: '🌧️' };
    if ([66, 67].includes(c)) return { txt: '어는 비', emoji: '🌧️' };
    if ([71, 73, 75, 77].includes(c)) return { txt: '눈/눈보라', emoji: '🌨️' };
    if ([80, 81, 82].includes(c)) return { txt: '소나기', emoji: '🌦️' };
    if ([95, 96, 99].includes(c)) return { txt: '뇌우', emoji: '⛈️' };
    return { txt: '기상', emoji: '🌡️' };
}

function degToCompass8(deg) {
    const d = Number(deg);
    if (isNaN(d)) return '-';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(((d % 360) / 45)) % 8];
}

// ---- 피커 (Marine + Weather 각각에서 target 시각에 가장 가까운 값) ----
function pickFromMarine(js, targetISO) {
    const H = js?.hourly || {};
    const tArr = H.time || [];
    if (!tArr.length) return null;
    const i = _closestIndex(tArr, targetISO);

    return {
        waveHeightM: H.wave_height?.[i],
        waveFromDeg: H.wave_direction?.[i],
        sstC: H.sea_surface_temperature?.[i],
        currentMS: H.ocean_current_velocity?.[i],
        currentToDeg: H.ocean_current_direction?.[i]
    };
}

function pickFromWeather(js, targetISO) {
    const H = js?.hourly || {};
    const tArr = H.time || [];
    if (!tArr.length) return null;
    const i = _closestIndex(tArr, targetISO);

    const code = H.weather_code?.[i];
    const wd = weatherCodeToTextEmoji(code);

    return {
        airTempC: H.temperature_2m?.[i],
        windMS: H.wind_speed_10m?.[i],
        windFromDeg: H.wind_direction_10m?.[i],
        visibilityKm: (H.visibility?.[i] != null) ? (Number(H.visibility[i]) / 1000) : null,
        weatherText: wd.txt,
        emoji: wd.emoji
    };
}

// ---- 팝업 HTML ----
function buildEnvPopupHTML(env) {
    if (!env) return "<div>데이터 없음</div>";
    const fmt = (v, f = 1, suf = '') => (v == null || isNaN(v)) ? '-' : (Number(v).toFixed(f) + suf);

    return `
  <div style="font:12px/1.5 -apple-system,Segoe UI,Arial">
    <div><strong>기온</strong> ${fmt(env.airTempC, 1, '°C')} ${env.emoji ?? ''}</div>
    <div><strong>바람</strong> ${fmt(env.windMS, 1, ' m/s')} (${degToCompass8(env.windFromDeg)}에서)</div>
    <div><strong>가시거리</strong> ${env.visibilityKm != null ? fmt(env.visibilityKm, 1, ' km') : '-'}</div>
    <div><strong>파고</strong> ${fmt(env.waveHeightM, 1, ' m')} (${degToCompass8(env.waveFromDeg)})</div>
    <div><strong>해류</strong> ${fmt(env.currentMS, 2, ' m/s')} (${degToCompass8(env.currentToDeg)})</div>
    <div><strong>해수온도</strong> ${fmt(env.sstC, 1, ' °C')}</div>
  </div>`;
}

// ---- 하나로 합치기 (vessel-map.js에서 사용하기 편하게) ----
function ajaxEnvAt(lat, lon, targetISO) {
    const iso = _safeISO(targetISO);
    // 두 API 병렬 호출 후 iso에 가장 가까운 시각으로 머지
    return $.when(ajaxMarine(lat, lon), ajaxWeather(lat, lon)).then((mRes, wRes) => {
        const marine = mRes && mRes[0];
        const weather = wRes && wRes[0];
        const mPick = pickFromMarine(marine, iso);
        const wPick = pickFromWeather(weather, iso);
        return { ...(wPick || {}), ...(mPick || {}) };
    });
}

// 전역 export
window.ajaxEnvAt = ajaxEnvAt;
window.buildEnvPopupHTML = buildEnvPopupHTML;
