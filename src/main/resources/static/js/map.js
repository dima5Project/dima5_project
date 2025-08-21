document.addEventListener("DOMContentLoaded", () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [127.05, 33.13],
        zoom: 5.2,
        scrollZoom: true,
        attributionControl: false
    });

    map.setProjection('mercator');

    // ── 소스/레이어 id
    const routeSourceId = 'route-source';
    const routeLayerId = 'route-layer';
    const markerSourceId = 'marker-source';
    const markerLayerId = 'marker-layer';
    const lastMarkerSourceId = 'last-marker-source';
    const lastMarkerLayerId = 'last-marker-layer';

    // 항구 마커(지도 위 DOM Marker) 관리
    const allPortMarkers = [];
    const markerElByPortId = new Map(); // portId -> DOM Element
    const portCoordsById = new Map();   // portId -> {lng, lat}

    // 날씨/혼잡 토글
    let weatherVisible = false;
    let congestionVisible = false;
    let weatherBulkAvailable = true; // ★ 추가

    // 팝업
    const hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '340px', offset: 35 });
    const busanHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '90px', offset: 35, anchor: 'bottom', className: 'busan-popup-container' });
    const marineHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom', offset: 16 });

    // ─────────────────────────────
    // 좌표 안전 보정기: [lat,lng] 섞임 방지
    // ─────────────────────────────
    // 기존 safeLngLat 지우고 ↓ 이걸로 교체
    function safeLngLat(coords) {
        const a = Array.isArray(coords) ? Number(coords[0]) : NaN;
        const b = Array.isArray(coords) ? Number(coords[1]) : NaN;
        return [a, b]; // 데이터가 이미 [lng,lat] 이므로 그대로 반환
    }

    // 날씨 이모지 span 보장
    function ensureEmojiEl(markerEl) {
        let span = markerEl.querySelector('.weather-emoji');
        if (!span) {
            span = document.createElement('span');
            span.className = 'weather-emoji';
            span.style.position = 'absolute';
            span.style.userSelect = 'none';
            span.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,.25))';
            span.style.display = weatherVisible ? '' : 'none';
            markerEl.appendChild(span);
        }
        return span;
    }

    // 날씨 벌크/폴백
    async function fetchAllWeatherEmojisBulk() {
        if (!weatherBulkAvailable) return null; // ★ 이미 불가면 아예 호출 안 함
        const r = await fetch('/api/info/weather/bulk', { cache: 'no-cache' });
        if (r.status === 404) {
            weatherBulkAvailable = false; // ★ 한 번 404면 이후로 계속 폴백만
            return null;
        }
        if (!r.ok) throw new Error('bulk weather api 실패');
        return r.json();
    }
    async function updateWeatherEmojis() {
        try {
            let list = await fetchAllWeatherEmojisBulk(); // null이면 폴백
            if (!list) {
                const entries = Array.from(portCoordsById.entries());
                list = await Promise.all(entries.map(async ([portId, { lng, lat }]) => {
                    try {
                        const r = await fetch(`/api/info/weather/direct?lat=${lat}&lon=${lng}`, { cache: 'no-cache' });
                        const j = r.ok ? await r.json() : null;
                        return { portId, emoji: (j?.weatherEmoji ?? '🌫️') };
                    } catch {
                        return { portId, emoji: '🌫️' };
                    }
                }));
            }
            list.forEach(({ portId, emoji }) => {
                const el = markerElByPortId.get(portId);
                if (!el) return;
                const span = ensureEmojiEl(el);
                span.textContent = emoji || '🌫️';
                span.style.display = weatherVisible ? '' : 'none';
            });
        } catch (e) {
            // 지나치게 시끄럽지 않게 warn으로 낮춤
            console.warn('updateWeatherEmojis fallback warn:', e?.message || e);
        }
    }

    // 혼잡 링
    async function fetchAllCongestions() {
        const r = await fetch('/api/info/docking/all', { cache: 'no-cache' });
        if (!r.ok) throw new Error('docking/all API 실패');
        return r.json();
    }
    const levelToClass = s => {
        s = (s || '').trim();
        if (s === '매우 혼잡') return 'cong--high';
        if (s === '혼잡') return 'cong--mid';
        return 'cong--low';
    };
    async function updateCongestion() {
        try {
            const data = await fetchAllCongestions();
            data.forEach(item => {
                const el = markerElByPortId.get(item.portId);
                if (!el) return;
                el.querySelectorAll('.cong-ring').forEach(n => n.remove());
                const ring = document.createElement('span');
                ring.className = `cong-ring ${levelToClass(item.congestionLevel)}`;
                ring.style.display = congestionVisible ? '' : 'none';
                el.appendChild(ring);
            });
        } catch (e) { console.error(e); }
    }

    // 컨트롤
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    // 항구 마커용 SVG → DOM
    async function loadSvgText(url) {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('SVG 로드 실패: ' + url);
        return res.text();
    }
    function makeSvgMarker(svgText, { color = '#0ea5e9', size = 28 } = {}) {
        const wrap = document.createElement('div');
        wrap.className = 'port-marker';
        wrap.style.width = `${size}px`;
        wrap.style.height = `${size}px`;
        wrap.style.lineHeight = 0;
        wrap.style.cursor = 'pointer';
        wrap.style.position = 'relative';

        wrap.innerHTML = svgText;
        const svg = wrap.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', `${size}px`);
            svg.setAttribute('height', `${size}px`);
            svg.style.display = 'block';
        }
        wrap.querySelectorAll('path,circle,rect,ellipse,polygon').forEach(n => {
            const hasFill = n.hasAttribute('fill') && n.getAttribute('fill') !== 'none';
            const usesCurrent = n.getAttribute('fill') === 'currentColor';
            if (hasFill || usesCurrent) n.setAttribute('fill', color);
        });
        return wrap;
    }

    // 항구 DOM 마커 생성 (★ 여기서 safeLngLat 사용)
    async function addPortMarkers() {
        const SVG_URL = '/images/portpredictImages/port_icon.svg';
        // const [svgText, geojson] = await Promise.all([
        //     loadSvgText(SVG_URL),
        //     fetch('/data/ports.geojson', { cache: 'no-cache' }).then(r => {
        //         if (!r.ok) throw new Error('ports.geojson 로드 실패');
        //         return r.json();
        //     })
        // ]);
        const dataUrl = new URL('/data/ports.fixed.geojson', location.origin).toString();
        console.log('[ports] fetching:', dataUrl);
        const res = await fetch(dataUrl, { cache: 'no-cache' });


        const [svgText, geojson] = await Promise.all([
            loadSvgText(SVG_URL),
            fetch('/data/ports.fixed.geojson?v=' + Date.now(), { cache: 'no-cache' }).then(r => {
                if (!r.ok) throw new Error('ports.fixed.geojson 로드 실패');
                return r.json();
            })
        ]);
        geojson.features.forEach(f => {
            if (!f.geometry || f.geometry.type !== 'Point') return;

            const [lng, lat] = safeLngLat(f.geometry.coordinates || []);
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

            const portId = f.properties?.port_id || '';
            const color = f.properties?.color || '#013895';
            const size = f.properties?.size || 28;

            const el = makeSvgMarker(svgText, { color, size });
            el.dataset.portId = portId;

            // 매핑/좌표 저장 (날씨 폴백/토글용)
            markerElByPortId.set(portId, el);
            portCoordsById.set(portId, { lng, lat });

            // 클릭 → 상세 페이지
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 180);
                if (!portId) return;
                window.location.assign(`/port/info?port=${encodeURIComponent(portId)}`);
            });

            // 호버 → 카드
            el.addEventListener('mouseenter', async () => {
                try {
                    const res = await fetch(`/api/info/hover/${encodeURIComponent(portId)}`, { cache: 'no-cache' });
                    const dto = res.ok ? await res.json() : null;
                    const w = dto?.weather || {};
                    const dock = dto?.docking || {};
                    const tz = dto?.timezone || {};
                    const congLevel = (dock.congestionLevel || '').trim();
                    const congClass = congLevel === '매우 혼잡' ? 'cong--high' : congLevel === '혼잡' ? 'cong--mid' : 'cong--low';
                    const html = `
            <div class="port-hover-card">
              <div class="port-hover-card__hd">${dto?.portNameKr || portId}</div>
              <div class="port-hover-card__divider"></div>
              <div class="port-hover-card__bd">
                <div class="port-row"><div class="port-row__icon">💨</div><div class="port-row__label">바람</div>
                  <div class="port-row__val">${Number(w.windSpeed ?? 0).toFixed(1)} m/s · ${Number(w.windDeg ?? 0)}°</div></div>
                <div class="port-row"><div class="port-row__icon">☁️</div><div class="port-row__label">날씨</div>
                  <div class="port-row__val">${Number(w.temperature ?? 0).toFixed(1)} °C</div></div>
                <div class="port-row"><div class="port-row__icon">🚢</div><div class="port-row__label">혼잡도</div>
                  <div class="port-row__val"><span class="cong-dot ${congClass}"></span>${congLevel || '원활'}</div></div>
                <div class="port-row"><div class="port-row__icon">🕒</div><div class="port-row__label">시차</div>
                  <div class="port-row__val">UTC ${tz.utcOffset || '+0'}</div></div>
              </div>
            </div>`;
                    hoverPopup.setLngLat([lng, lat]).setHTML(html).addTo(map);
                } catch (e) {
                    hoverPopup.setLngLat([lng, lat]).setHTML(`<div class="port-hover-card"><div class="port-hover-card__hd">${portId}</div><div class="port-hover-card__divider"></div><div class="port-hover-card__bd"><div class="port-row__val" style="padding:8px 0;">데이터를 불러오지 못했습니다.</div></div></div>`).addTo(map);
                }
            });
            el.addEventListener('mouseleave', () => hoverPopup.remove());

            // DOM Marker 생성 (핀 끝이 위치에 닿도록 anchor: 'bottom')
            const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom', offset: [0, 0] })
                .setLngLat([lng, lat])
                .addTo(map);

            allPortMarkers.push(marker);
        });
    }

    // 토글 버튼(혼잡/날씨)
    document.addEventListener('click', e => {
        const congBtn = e.target.closest('#congestion-btn');
        if (congBtn) {
            congestionVisible = !congestionVisible;
            congBtn.classList.toggle('is-on', congestionVisible);
            markerElByPortId.forEach(el => {
                const ring = el.querySelector('.cong-ring');
                if (ring) ring.style.display = congestionVisible ? '' : 'none';
            });
            if (congestionVisible) updateCongestion();
        }

        const weatherBtn = e.target.closest('#weather-btn');
        if (weatherBtn) {
            weatherVisible = !weatherVisible;
            weatherBtn.classList.toggle('is-on', weatherVisible);
            if (weatherVisible) updateWeatherEmojis();
            markerElByPortId.forEach(el => {
                const s = el.querySelector('.weather-emoji');
                if (s) s.style.display = weatherVisible ? '' : 'none';
            });
        }
    });

    // ───────────── 지도 로드
    map.on('load', async () => {

        map.addSource('debug-port-src', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
            id: 'debug-port-layer',
            type: 'circle',
            source: 'debug-port-src',
            paint: {
                'circle-color': '#ff3b30',
                'circle-radius': 3,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
        // 불필요 라벨 숨김
        map.getStyle().layers
            .filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label')))
            .forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));

        // 경로/타임라인/최신점 소스·레이어
        map.addSource(routeSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: routeLayerId, type: 'line', source: routeSourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4 }
        });

        map.addSource(markerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: markerLayerId, type: 'circle', source: markerSourceId,
            paint: { 'circle-radius': 6, 'circle-color': '#34495e', 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' }
        });

        map.addSource(lastMarkerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: lastMarkerLayerId, type: 'circle', source: lastMarkerSourceId,
            paint: { 'circle-radius': 8, 'circle-color': '#00bfff', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
        });

        // 항구 마커 DOM으로 추가(★ 제자리 고정)
        await addPortMarkers().catch(console.error);

        try {
            const feats = [];
            markerElByPortId.forEach((_, pid) => {
                const c = portCoordsById.get(pid);
                if (c) feats.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
                    properties: { id: pid }
                });
            });
            const debugSrc = map.getSource('debug-port-src');
            if (debugSrc) debugSrc.setData({ type: 'FeatureCollection', features: feats });
        } catch (e) {
            console.error('debug fill fail', e);
        }

        // 최초 혼잡 데이터 준비(표시는 토글로)
        try { await updateCongestion(); } catch (e) { console.error(e); }

        // 부산 고정 마커(동일 DOM 방식)
        const svgText = await loadSvgText('/images/portpredictImages/port_icon.svg');
        const busanEl = makeSvgMarker(svgText, { color: '#013895', size: 28 });
        busanEl.dataset.portId = 'KRBUS';
        const busanMarker = new mapboxgl.Marker({ element: busanEl, anchor: 'bottom', offset: [0, 0] })
            .setLngLat([129.040, 35.106]).addTo(map);
        allPortMarkers.push(busanMarker);
        markerElByPortId.set('KRBUS', busanEl);
        portCoordsById.set('KRBUS', { lng: 129.040, lat: 35.106 });
        busanEl.addEventListener('mouseenter', () => {
            busanHoverPopup.setLngLat([129.040, 35.106]).setHTML(`<div class="port-hover-card busan-hover-card"><div class="port-hover-card__hd">KRBUS</div></div>`).addTo(map);
        });
        busanEl.addEventListener('mouseleave', () => busanHoverPopup.remove());

        // 최신점 hover(환경정보)
        let hoverTimeout;
        map.on('mouseenter', lastMarkerLayerId, async (e) => {
            clearTimeout(hoverTimeout);
            const f = e.features && e.features[0];
            if (!f) return;
            const [lon, lat] = f.geometry.coordinates;
            const targetISO = (typeof window.lastVesselTsISO === 'string' && window.lastVesselTsISO) ? window.lastVesselTsISO : new Date().toISOString();
            try {
                const env = await window.ajaxEnvAt(lat, lon, targetISO);
                const html = window.buildEnvPopupHTML(env);
                marineHoverPopup.setLngLat([lon, lat]).setHTML(html).addTo(map);
            } catch (err) { console.error('hover env fail', err); }
        });
        map.on('mouseleave', lastMarkerLayerId, () => { hoverTimeout = setTimeout(() => marineHoverPopup.remove(), 120); });
    });

    // ===== 외부 API =====
    window.drawRoutes = function (routes) {
        if (!map || !map.getSource(routeSourceId)) return;
        const features = routes.map(r => ({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: r.coordinates },
            properties: { name: r.route_name, color: r.color }
        }));
        map.getSource(routeSourceId).setData({ type: 'FeatureCollection', features });
    };

    window.drawMarkers = function (markers, lastMarker) {
        if (!map || !map.getSource(markerSourceId) || !map.getSource(lastMarkerSourceId)) return;
        const feats = markers.map(m => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: m.coordinates },
            properties: { description: m.description }
        }));
        map.getSource(markerSourceId).setData({ type: 'FeatureCollection', features: feats });

        const last = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: lastMarker.coordinates },
            properties: { description: lastMarker.description }
        };
        map.getSource(lastMarkerSourceId).setData({ type: 'FeatureCollection', features: [last] });
    };

    // 타임라인/최신점 표시만 토글 (항구 DOM 마커는 그대로)
    window.toggleMarkersVisibility = function (isVisible) {
        if (!map || !map.getLayer(markerLayerId) || !map.getLayer(lastMarkerLayerId)) return;
        const vis = isVisible ? 'visible' : 'none';
        map.setLayoutProperty(markerLayerId, 'visibility', vis);
        map.setLayoutProperty(lastMarkerLayerId, 'visibility', vis);
    };

    // 랭크 필터 (부산은 항상 표시)
    window.togglePortMarkersByRank = function (ranksToKeep) {
        const portIdsToKeep = new Set(globalPredictions.filter(p => ranksToKeep.includes(p.rank)).map(p => p.port_id));
        portIdsToKeep.add('KRBUS');
        allPortMarkers.forEach(m => {
            const id = m.getElement().dataset.portId;
            m.getElement().style.display = portIdsToKeep.has(id) ? '' : 'none';
        });
    };
    window.hideAllPortMarkers = function () {
        allPortMarkers.forEach(m => {
            if (m.getElement().dataset.portId !== 'KRBUS') m.getElement().style.display = 'none';
        });
    };
    window.showAllPortMarkers = function () {
        allPortMarkers.forEach(m => { m.getElement().style.display = ''; });
    };

    // 초기화: 항로/타임라인/최신점만 비움(항구 마커는 유지)
    window.clearRoutesAndMarkers = function () {
        if (!map) return;
        const empty = { type: 'FeatureCollection', features: [] };
        if (map.getSource(routeSourceId)) map.getSource(routeSourceId).setData(empty);
        if (map.getSource(markerSourceId)) map.getSource(markerSourceId).setData(empty);
        if (map.getSource(lastMarkerSourceId)) map.getSource(lastMarkerSourceId).setData(empty);
        // 가시성은 필요 시만 토글
        // map.setLayoutProperty(markerLayerId,'visibility','none');
        // map.setLayoutProperty(lastMarkerLayerId,'visibility','none');
    };
});
