// map.js
document.addEventListener("DOMContentLoaded", () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [129.05, 35.13],
        zoom: 6,
        scrollZoom: true,
        attributionControl: false
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    // ─────────────────────────────────────────
    // 0) Hover 카드 유틸
    // ─────────────────────────────────────────
    function degToCompass16(deg) {
        const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const i = Math.round(((deg % 360) / 22.5)) % 16;
        return dirs[i];
    }

    function buildPortHoverCardHTML({ portId, windSpdMS, windDirDeg, tempC, congestion, tzText }) {
        const dirLabel = degToCompass16(windDirDeg || 0);
        const congClass = congestion === 'high' ? 'cong--high'
            : congestion === 'mid' ? 'cong--mid'
                : 'cong--low';
        const congText = congestion === 'high' ? '매우 혼잡'
            : congestion === 'mid' ? '보통'
                : '원활';

        return `
    <div class="port-hover-card">
      <div class="port-hover-card__hd">${portId}</div>
      <div class="port-hover-card__divider"></div>
      <div class="port-hover-card__bd">
        <div class="port-row">
          <div class="port-row__icon">💨</div>
          <div class="port-row__label">바람</div>
          <div class="port-row__val">
            ${Number(windSpdMS ?? 0).toFixed(1)} m/s · ${Number(windDirDeg ?? 0)}°
            <span class="subtle">(${dirLabel})</span>
          </div>  
        </div>
        <div class="port-row">
          <div class="port-row__icon">☁️</div>
          <div class="port-row__label">날씨</div>
          <div class="port-row__val">${Number(tempC ?? 0).toFixed(1)} °C</div>
        </div>
        <div class="port-row">
          <div class="port-row__icon">🚢</div>
          <div class="port-row__label">혼잡도</div>
          <div class="port-row__val"><span class="cong-dot ${congClass}"></span>${congText}</div>
        </div>
        <div class="port-row">
          <div class="port-row__icon">🕒</div>
          <div class="port-row__label">시차</div>
          <div class="port-row__val">UTC ${tzText || '+0'}</div>
        </div>
      </div>
    </div>`;
    }

    const portMetaCache = new Map();
    async function ensurePortMeta(portId, lon, lat) {
        if (portMetaCache.has(portId)) return portMetaCache.get(portId);

        // TODO: 여기서 실제 Open‑Meteo 호출로 교체
        const mock = { windSpdMS: 3.2, windDirDeg: 180, tempC: 28.2, congestion: 'high', tzText: '+3' };
        portMetaCache.set(portId, mock);
        return mock;
    }

    const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '340px',
        offset: 35
    });

    // [ADDED] 백엔드 Hover API 호출 + 캐시(TTL)
    const hoverCache = new Map();
    const HOVER_TTL_MS = 60000;
    async function fetchHoverDTO(portId) {
        const now = Date.now();
        const cached = hoverCache.get(portId);
        if (cached && (now - cached.t) < HOVER_TTL_MS) return cached.v;
        const res = await fetch(`/api/info/hover/${encodeURIComponent(portId)}`, { cache: 'no-cache' });
        if (!res.ok) throw new Error('hover API 실패: ' + portId);
        const data = await res.json();
        hoverCache.set(portId, { t: now, v: data });
        return data;
    }

    // [ADDED] DTO → 기존 카드 파라미터로 매핑(최소 변경용 어댑터)
    function mapHoverDtoToCardParams(dto) {
        const w = dto.weather || {};
        const dock = dto.docking || {};
        const tz = dto.timezone || {};
        // 혼잡도 등급을 기존(high/mid/low)로 매핑
        const congLevel = (dock.congestionLevel || '').trim();
        const congestion =
            congLevel === '매우 혼잡' ? 'high' :
                congLevel === '혼잡' ? 'mid' :
                    'low';

        return {
            portId: dto.portNameKr || dto.portId,
            windSpdMS: w.windSpeed,
            windDirDeg: w.windDeg,
            tempC: w.temperature,
            congestion,
            tzText: tz.utcOffset
        };
    }


    // ─────────────────────────────────────────
    // 1) SVG 로드/마커 element 생성
    // ─────────────────────────────────────────
    async function loadSvgText(url) {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('SVG 로드 실패: ' + url);
        return await res.text();
    }

    function makeSvgMarker(svgText, { color = '#0ea5e9', size = 28 } = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'port-marker';
        wrapper.style.width = `${size}px`;
        wrapper.style.height = `${size}px`;
        wrapper.style.lineHeight = 0;
        wrapper.style.cursor = 'pointer';

        wrapper.innerHTML = svgText;
        const svgEl = wrapper.querySelector('svg');
        if (svgEl) {
            svgEl.setAttribute('width', `${size}px`);
            svgEl.setAttribute('height', `${size}px`);
            svgEl.style.display = 'block';
        }
        wrapper.querySelectorAll('path, circle, rect, ellipse, polygon').forEach(node => {
            const hasFill = node.hasAttribute('fill') && node.getAttribute('fill') !== 'none';
            const usesCurrentColor = node.getAttribute('fill') === 'currentColor';
            if (hasFill || usesCurrentColor) node.setAttribute('fill', color);
        });
        return wrapper;
    }

    // ─────────────────────────────────────────
    // 2) GeoJSON 로드 후 포트 마커 추가 (+ hover 카드)
    // ─────────────────────────────────────────
    async function addPortMarkers() {
        const SVG_URL = '/images/portpredictImages/port_icon.svg';
        const [svgText, geojson] = await Promise.all([
            loadSvgText(SVG_URL),
            fetch('/data/ports.geojson', { cache: 'no-cache' }).then(r => {
                if (!r.ok) throw new Error('ports.geojson 로드 실패'); return r.json();
            })
        ]);

        geojson.features.forEach(f => {
            if (!f.geometry || f.geometry.type !== 'Point') return;
            const [lng, lat] = f.geometry.coordinates || [];
            if (typeof lng !== 'number' || typeof lat !== 'number') return;

            const color = f.properties?.color || '#013895';
            const size = f.properties?.size || 28;

            const el = makeSvgMarker(svgText, { color, size });

            // 클릭 팝업 (기존 동작 유지)
            el.addEventListener('click', () => {
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 180);

                // const pid = f.properties?.port_id ?? 'Unknown Port';
                // const locLa = f.properties?.loc_lat ?? lat;
                // const locLo = f.properties?.loc_lon ?? lng;

                const portId = f.properties?.port_id || '';
                if (!portId) return;

                new mapboxgl.Popup()
                    .setLngLat([lng, lat])
                    .setHTML(`<div style="font-weight:700">${pid}</div>
                    <div style="font-size:12px;color:#666">(${locLa}, ${locLo})</div>`)
                    .addTo(map);

                // 1초 후 페이지 이동
                setTimeout(() => {
                    window.location.href = `/port/info?port=${encodeURIComponent(portId)}`;
                }, 1000);
            });

            // 마커 추가
            new mapboxgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .addTo(map);

            // ⬇ Hover 카드: 마커 생성 직후에 연결 (이 블록만 교체)
            el.addEventListener('mouseenter', async () => {
                const pid = f.properties?.port_id || 'Unknown';

                try {
                    const dto = await fetchHoverDTO(pid);
                    const cardParams = mapHoverDtoToCardParams(dto);
                    const html = buildPortHoverCardHTML(cardParams);
                    hoverPopup.setLngLat([lng, lat]).setHTML(html).addTo(map);
                } catch (e) {
                    console.error('HOVER API ERROR for', pid, e);
                    const html = `
      <div class="port-hover-card">
        <div class="port-hover-card__hd">${pid}</div>
        <div class="port-hover-card__divider"></div>
        <div class="port-hover-card__bd">
          <div class="port-row__val" style="padding:8px 0;">데이터를 불러오지 못했습니다.</div>
        </div>
      </div>`;
                    hoverPopup.setLngLat([lng, lat]).setHTML(html).addTo(map);
                }
            });

            el.addEventListener('mouseleave', () => hoverPopup.remove());

            // ✅ 클릭: 부가정보 페이지로 이동 (/port/info?port={portId})
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();

                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 180);

                const portId = f.properties?.port_id || '';
                if (!portId) return;

                // 필요하면 잠깐 팝업 유지 후 이동하려면 setTimeout으로 지연
                // setTimeout(() => {
                //   window.location.assign(`/port/info?port=${encodeURIComponent(portId)}`);
                // }, 800);

                window.location.assign(`/port/info?port=${encodeURIComponent(portId)}`);
            });
        });
    }

    // ─────────────────────────────────────────
    // 3) 맵 로드 후 실행
    // ─────────────────────────────────────────
    map.on('load', async () => {
        // (선택) 베이스맵 라벨 감추기
        map.getStyle().layers
            .filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label')))
            .forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));

        // 커스텀 SVG 포트 마커 + hover 카드
        await addPortMarkers().catch(console.error);

        // 부산항 고정 마커 (기존)
        const SVG_URL = '/images/portpredictImages/port_icon.svg';
        const svgText = await loadSvgText(SVG_URL);
        const busanEl = makeSvgMarker(svgText, { color: '#013895', size: 28 });
        busanEl.addEventListener('click', () => {
            busanEl.classList.add('bump');
            setTimeout(() => busanEl.classList.remove('bump'), 180);
            new mapboxgl.Popup()
                .setLngLat([129.040, 35.106])
                .setHTML(`<div style="font-weight:700">Busan Port</div>
                  <div style="font-size:12px;color:#666">(35.106, 129.040)</div>`)
                .addTo(map); setTimeout
        });
        new mapboxgl.Marker({ element: busanEl, anchor: 'bottom' })
            .setLngLat([129.040, 35.106])
            .addTo(map);
    });
});

