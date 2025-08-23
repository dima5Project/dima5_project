document.addEventListener("DOMContentLoaded", () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ';

    // ▼ [추가] 지도 스타일 변경 후 복원을 위한 데이터 저장 변수
    let lastDrawnRoutes = null;
    let lastDrawnMarkers = null;
    let lastDrawnLastMarker = null;
    let isInitialStyleLoad = true; // [추가] 초기 로드 확인용 플래그

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [127.05, 33.13],
        zoom: 5.5,
        scrollZoom: true,
        attributionControl: false
    });

    map.setProjection('mercator');

    // ── 소스/레이어 id
    const routeSourceId_rank1 = 'route-source-rank1';
    const routeLayerId_rank1 = 'route-layer-rank1';
    const routeSourceId_rank2 = 'route-source-rank2';
    const routeLayerId_rank2 = 'route-layer-rank2';
    const routeSourceId_rank3 = 'route-source-rank3';
    const routeLayerId_rank3 = 'route-layer-rank3';
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
    const marineHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom', offset: 16, className: 'marine-popup' });

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

            // KRPUS에 대한 가짜 주황색 원 추가
            const krpusEl = markerElByPortId.get('KRPUS');
            if (krpusEl) {
                // 다른 데이터에 의해 KRPUS 링이 생성되었을 수 있으므로, 일단 모두 제거
                krpusEl.querySelectorAll('.cong-ring').forEach(n => n.remove());
                const krpusRing = document.createElement('span');
                krpusRing.className = 'cong-ring cong--mid'; // '혼잡' 수준(주황색)
                krpusRing.style.display = congestionVisible ? '' : 'none';
                krpusEl.appendChild(krpusRing);
            }
        } catch (e) { console.error(e); }
    }

    // 컨트롤
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    // 항구 마커 생성
    function makeCircleMarker({ color = '#013895' } = {}) {
        const el = document.createElement('div');
        el.className = 'port-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.backgroundColor = color;
        el.style.border = '2px solid #fff';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.boxSizing = 'border-box';
        return el;
    }

    // 항구 DOM 마커 생성 (★ 여기서 safeLngLat 사용)
    async function addPortMarkers() {
        const geojson = await fetch('/data/ports.geojson', { cache: 'no-cache' }).then(r => {
            if (!r.ok) throw new Error('ports.geojson 로드 실패');
            return r.json();
        });

        geojson.features.forEach(f => {
            if (!f.geometry || f.geometry.type !== 'Point') return;

            const [lng, lat] = safeLngLat(f.geometry.coordinates || []);
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

            const portId = f.properties?.port_id || '';
            const color = f.properties?.color || '#013895';

            const el = makeCircleMarker({ color });
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


    // [추가] 지도 스타일 버튼 독립 핸들러
    const mapStyleBtn = document.getElementById('map-style-btn');
    if (mapStyleBtn) {
        let isAltStyle = false;
        mapStyleBtn.addEventListener('click', () => {
            isAltStyle = !isAltStyle;
            mapStyleBtn.classList.toggle('is-on', isAltStyle);
            const newStyle = isAltStyle ? 'mapbox://styles/mapbox/outdoors-v12' : 'mapbox://styles/mapbox/light-v10';
            map.setStyle(newStyle);
        });
    }

    // ───────────── 지도 로드
    map.on('load', async () => {


        // 불필요 라벨 숨김
        map.getStyle().layers
            .filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label')))
            .forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));

        // 경로/타임라인/최신점 소스·레이어
        // Arrived Route (solid line)
        map.addSource('arrived-route-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'arrived-route-layer', type: 'line', source: 'arrived-route-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4 }
        });

        // Rank 3 (bottom layer)
        map.addSource(routeSourceId_rank3, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: routeLayerId_rank3, type: 'line', source: routeSourceId_rank3,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] }
        });

        // Rank 2 (middle layer)
        map.addSource(routeSourceId_rank2, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: routeLayerId_rank2, type: 'line', source: routeSourceId_rank2,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] }
        });

        // Rank 1 (top layer)
        map.addSource(routeSourceId_rank1, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: routeLayerId_rank1, type: 'line', source: routeSourceId_rank1,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] }
        });

        map.addSource(markerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: markerLayerId, type: 'circle', source: markerSourceId,
            paint: { 'circle-radius': 10, 'circle-color': '#e6ebf0', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#e6ebf0' }
        });

        map.addSource(lastMarkerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: lastMarkerLayerId, type: 'circle', source: lastMarkerSourceId,
            paint: { 'circle-radius': 8, 'circle-color': '#00bfff', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
        });

        // 항구 마커 DOM으로 추가(★ 제자리 고정)
        await addPortMarkers().catch(console.error);



        // 최초 혼잡 데이터 준비(표시는 토글로)
        try { await updateCongestion(); } catch (e) { console.error(e); }

        // 부산 고정 마커(동일 DOM 방식)
        const busanEl = makeCircleMarker({ color: '#013895' });
        busanEl.dataset.portId = 'KRPUS';
        const busanMarker = new mapboxgl.Marker({ element: busanEl, anchor: 'bottom', offset: [0, 0] })
            .setLngLat([129.040, 35.106]).addTo(map);
        allPortMarkers.push(busanMarker);
        markerElByPortId.set('KRPUS', busanEl);
        portCoordsById.set('KRPUS', { lng: 129.040, lat: 35.106 });
        busanEl.addEventListener('mouseenter', () => {
            busanHoverPopup.setLngLat([129.040, 35.106]).setHTML(`<div class="port-hover-card busan-hover-card"><div class="port-hover-card__hd">부산</div></div>`).addTo(map);
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
        map.on('mouseleave', lastMarkerLayerId, () => { marineHoverPopup.remove(); });

        // ▼ [추가] 초기 로드가 완료되었음을 플래그로 표시
        isInitialStyleLoad = false;
    });

    // ▼ [수정] 지도 스타일이 변경된 후 실행될 이벤트 핸들러
    map.on('style.load', () => {
        // ▼ [추가] 초기 로드 시에는 이 핸들러가 실행되지 않도록 방지
        if (isInitialStyleLoad) {
            return;
        }

        // 1. 소스 및 레이어 다시 추가
        // Arrived Route
        map.addSource('arrived-route-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'arrived-route-layer', type: 'line', source: 'arrived-route-source', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
        // Rank 3
        map.addSource(routeSourceId_rank3, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: routeLayerId_rank3, type: 'line', source: routeSourceId_rank3, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] } });
        // Rank 2
        map.addSource(routeSourceId_rank2, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: routeLayerId_rank2, type: 'line', source: routeSourceId_rank2, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] } });
        // Rank 1
        map.addSource(routeSourceId_rank1, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: routeLayerId_rank1, type: 'line', source: routeSourceId_rank1, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] } });
        // Markers
        map.addSource(markerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: markerLayerId, type: 'circle', source: markerSourceId, paint: { 'circle-radius': 10, 'circle-color': '#e6ebf0', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#e6ebf0' } });
        // Last Marker
        map.addSource(lastMarkerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: lastMarkerLayerId, type: 'circle', source: lastMarkerSourceId, paint: { 'circle-radius': 8, 'circle-color': '#00bfff', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });

        // 2. DOM 마커들 다시 추가
        allPortMarkers.forEach(marker => marker.addTo(map));

        // 3. 저장된 데이터가 있으면 다시 그리기
        if (lastDrawnRoutes) {
            window.drawRoutes(lastDrawnRoutes);
        }
        if (lastDrawnMarkers && lastDrawnLastMarker) {
            window.drawMarkers(lastDrawnMarkers, lastDrawnLastMarker);
        }

        // 4. 혼잡도/날씨 오버레이 상태 복원
        markerElByPortId.forEach(el => {
            const ring = el.querySelector('.cong-ring');
            if (ring) ring.style.display = congestionVisible ? '' : 'none';
            const emoji = el.querySelector('.weather-emoji');
            if (emoji) emoji.style.display = weatherVisible ? '' : 'none';
        });

        // 5. 기타 설정 및 이벤트 리스너 복원
        map.setProjection('mercator');
        map.getStyle().layers.filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label'))).forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));
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
        map.on('mouseleave', lastMarkerLayerId, () => { marineHoverPopup.remove(); });
    });

    // ===== 외부 API =====
    window.drawRoutes = function (routes) {
        if (!map) return;
        lastDrawnRoutes = routes; // [추가]

        // Prepare features for each rank
        const featuresRank1 = [];
        const featuresRank2 = [];
        const featuresRank3 = [];
        const featuresArrived = [];

        routes.forEach(r => {
            const feature = {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: r.coordinates },
                properties: { name: r.route_name, color: r.color }
            };
            if (r.route_name === '도착 항로') {
                featuresArrived.push(feature);
            } else if (r.rank === 1) {
                featuresRank1.push(feature);
            } else if (r.rank === 2) {
                featuresRank2.push(feature);
            } else if (r.rank === 3) {
                featuresRank3.push(feature);
            }
        });

        // Update sources for each rank
        map.getSource('arrived-route-source').setData({ type: 'FeatureCollection', features: featuresArrived });
        map.getSource(routeSourceId_rank1).setData({ type: 'FeatureCollection', features: featuresRank1 });
        map.getSource(routeSourceId_rank2).setData({ type: 'FeatureCollection', features: featuresRank2 });
        map.getSource(routeSourceId_rank3).setData({ type: 'FeatureCollection', features: featuresRank3 });
    };

    window.drawMarkers = function (markers, lastMarker) {
        if (!map) return;
        lastDrawnMarkers = markers; // [추가]
        lastDrawnLastMarker = lastMarker; // [추가]
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
        portIdsToKeep.add('KRPUS');
        allPortMarkers.forEach(m => {
            const id = m.getElement().dataset.portId;
            m.getElement().style.display = portIdsToKeep.has(id) ? '' : 'none';
        });
    };

    window.showSpecificPortMarkers = function (portIdsToShow) {
        const idSet = new Set(portIdsToShow);
        allPortMarkers.forEach(m => {
            const id = m.getElement().dataset.portId;
            if (id) {
                m.getElement().style.display = idSet.has(id) ? '' : 'none';
            }
        });
    };

    window.hideAllPortMarkers = function () {
        allPortMarkers.forEach(m => {
            if (m.getElement().dataset.portId !== 'KRPUS') m.getElement().style.display = 'none';
        });
    };
    window.showAllPortMarkers = function () {
        allPortMarkers.forEach(m => { m.getElement().style.display = ''; });
    };

    // 초기화: 항로/타임라인/최신점만 비움(항구 마커는 유지)
    window.clearRoutesAndMarkers = function () {
        if (!map) return;
        const empty = { type: 'FeatureCollection', features: [] };
        if (map.getSource('arrived-route-source')) map.getSource('arrived-route-source').setData(empty);
        if (map.getSource(routeSourceId_rank1)) map.getSource(routeSourceId_rank1).setData(empty);
        if (map.getSource(routeSourceId_rank2)) map.getSource(routeSourceId_rank2).setData(empty);
        if (map.getSource(routeSourceId_rank3)) map.getSource(routeSourceId_rank3).setData(empty);
        if (map.getSource(markerSourceId)) map.getSource(markerSourceId).setData(empty);
        if (map.getSource(lastMarkerSourceId)) map.getSource(lastMarkerSourceId).setData(empty);

        // [추가] 저장된 데이터도 초기화
        lastDrawnRoutes = null;
        lastDrawnMarkers = null;
        lastDrawnLastMarker = null;
    };

    // 조회 버튼 클릭 시 상위 1, 2, 3위 항구에 맞춰 뷰 조정
    function fitMapViewToTopPorts() {
        if (!window.globalPredictions || !portCoordsById) return;

        const topPorts = globalPredictions.filter(p => p.rank >= 1 && p.rank <= 3);
        if (topPorts.length === 0) return;

        const bounds = new mapboxgl.LngLatBounds();
        topPorts.forEach(p => {
            const coords = portCoordsById.get(p.port_id);
            if (coords) {
                bounds.extend([coords.lng, coords.lat]);
            }
        });

        // KRPUS (부산) 항구의 좌표도 포함
        const busanCoords = portCoordsById.get('KRPUS');
        if (busanCoords) {
            bounds.extend([busanCoords.lng, busanCoords.lat]);
        }

        map.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 450, right: 100 }, // 사이드바 고려하여 패딩 조정
            maxZoom: 10,
            duration: 1000
        });
    }

    // 조회 버튼에 이벤트 리스너 추가
    document.querySelector('.sidebar__btn.primary').addEventListener('click', () => {
        // globalPredictions가 채워진 후에 뷰 조정 함수를 호출
        // 약간의 지연을 주어 데이터 로드를 기다림
        setTimeout(fitMapViewToTopPorts, 500);
    });
});
