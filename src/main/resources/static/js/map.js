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
    let lastPositionMarker = null; // 현재 위치 마커 DOM 요소를 저장할 변수

    // 항구 마커(지도 위 DOM Marker) 관리
    const allPortMarkers = [];
    const markerElByPortId = new Map(); // portId -> DOM Element
    const portCoordsById = new Map();   // portId -> {lng, lat}
    let globalTimePointMarkerInstances = []; // New global variable for time point markers
    let destinationLabelPopup = null; // ▼ [추가] 1순위 항구 라벨 Popup 인스턴스

    // Expose to window for portpredict.js
    window.markerInstanceByPortId = new Map(); // New map for marker instances
    window.portCoordsById = portCoordsById; // Expose existing map

    // 날씨/혼잡 토글
    let weatherVisible = false;
    let congestionVisible = false;
    let weatherBulkAvailable = true; // ★ 추가

    // 팝업
    const hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '340px', offset: 35 });
    const busanHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '90px', offset: 35, anchor: 'bottom', className: 'busan-popup-container' });
    const marineHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom', offset: 16, className: 'marine-popup' });

    let isKrpusHoverEnabled = true; // KRPUS 마커 호버 기능 활성화 여부

    // ▼ [추가] 1순위 항구 라벨(Popup)을 생성/업데이트하는 함수
    window.updateDestinationLabel = function (portId, rank, lng, lat) {
        window.removeDestinationLabel(); // 기존 라벨이 있으면 일단 지우기

        if (rank !== 1) return; // 1순위가 아니면 아무것도 안함

        const html = `<div class="dest-label-box">Top-1 ${portId}</div>`;

        destinationLabelPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 35, // 마커 아이콘으로부터의 거리
            anchor: 'bottom', // 기본 위치는 마커 하단에 고정 (라벨이 위에 보임)
            className: 'destination-label-popup' // 커스텀 스타일을 위한 클래스
        })
            .setLngLat([lng, lat])
            .setHTML(html)
            .addTo(map);
    }

    // ▼ [추가] 1순위 항구 라벨(Popup)을 제거하는 함수
    window.removeDestinationLabel = function () {
        if (destinationLabelPopup) {
            destinationLabelPopup.remove();
            destinationLabelPopup = null;
        }
    }

    function safeLngLat(coords) {
        const a = Array.isArray(coords) ? Number(coords[0]) : NaN;
        const b = Array.isArray(coords) ? Number(coords[1]) : NaN;
        return [a, b]; // 데이터가 이미 [lng,lat] 이므로 그대로 반환
    }

    // calculateLineLength 함수 추가
    function calculateLineLength(coordinates) {
        let length = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
            const p1 = coordinates[i];
            const p2 = coordinates[i + 1];
            // 간단한 유클리드 거리 계산 (지도 단위)
            length += Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
        }
        return length;
    }

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
            console.warn('updateWeatherEmojis fallback warn:', e?.message || e);
        }
    }

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

            const krpusEl = markerElByPortId.get('KRPUS');
            if (krpusEl) {
                krpusEl.querySelectorAll('.cong-ring').forEach(n => n.remove());
                const krpusRing = document.createElement('span');
                krpusRing.className = 'cong-ring cong--mid'; // '혼잡' 수준(주황색)
                krpusRing.style.display = congestionVisible ? '' : 'none';
                krpusEl.appendChild(krpusRing);
            }
        } catch (e) { console.error(e); }
    }

    let destIconSvgContent = null; // Store SVG content to avoid refetching

    function applyCircleStyle(el, color = '#013895') {
        el.innerHTML = ''; // Clear any icon content
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.backgroundColor = color;
        el.style.border = '2px solid #fff';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.boxSizing = 'border-box';
    }

    async function updatePortMarkerIcon(portId, useIcon, rank = null) { // Added rank parameter
        const el = markerElByPortId.get(portId);
        if (!el) return;

        if (useIcon) {
            if (!destIconSvgContent) {
                try {
                    const response = await fetch('/images/portpredictImages/dest_icon.svg');
                    destIconSvgContent = await response.text();
                } catch (error) {
                    console.error('Failed to load dest_icon.svg:', error);
                    return; // Fallback if SVG can't be loaded
                }
            }

            el.style.backgroundColor = 'transparent';
            el.style.border = 'none';
            el.style.width = '28px'; // Adjust size for the SVG icon
            el.style.height = '28px';
            el.innerHTML = destIconSvgContent; // Inject SVG content directly

            const svgPath = el.querySelector('path'); // Assuming the SVG has a single path
            if (svgPath) {
                if (rank === 1) {
                    svgPath.style.fill = '#013895'; // Rank 1 color
                } else if (rank === 2) {
                    svgPath.style.fill = '#4F6F52'; // Rank 2 color (Green)
                } else if (rank === 3) {
                    svgPath.style.fill = '#666666'; // Rank 3 color (Dark Gray)
                } else {
                    svgPath.style.fill = '#000000'; // Default fallback
                }
            }

        } else {
            const originalColor = el.dataset.color || '#013895';
            applyCircleStyle(el, originalColor);
        }
    }

    function makeCircleMarker({ color = '#013895' } = {}) {
        const el = document.createElement('div');
        el.className = 'port-marker';
        applyCircleStyle(el, color); // Use the helper
        return el;
    }

    // New function for time_point markers
    function makeTimePointMarker(timePoint) {
        const el = document.createElement('div');
        el.className = 'time-point-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundColor = '#cfeeff'; // Circle color
        el.style.borderRadius = '50%';
        el.style.textAlign = 'center'; // NEW: Center content using text-align on parent
        el.style.border = 'none'; // 외곽선 제거
        el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
        el.style.cursor = 'pointer';
        el.style.zIndex = '1000'; // Ensure it's above routes

        const span = document.createElement('span');
        span.textContent = timePoint;
        span.style.color = '#013895'; // Text color
        span.style.fontWeight = '700';
        span.style.fontSize = '14px';
        span.style.lineHeight = '30px'; // For vertical centering within its line box
        span.style.textAlign = 'center'; // Add this for horizontal centering of text
        span.style.width = '100%'; // NEW: Ensure span takes full width for text-align to work
        el.appendChild(span);

        return el;
    }

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', function () {
        const zoomControl = document.querySelector('.mapboxgl-ctrl-zoom-in').parentElement;
        if (zoomControl) {
            zoomControl.classList.add('map-control-with-bg');
        }
    });

    // New function for KRPUS marker
    function updateKRPUSMarkerIcon(useVesselIcon) {
        console.log('updateKRPUSMarkerIcon called with useVesselIcon:', useVesselIcon);
        const krpusEl = markerElByPortId.get('KRPUS');
        if (!krpusEl) return;
        console.log('KRPUS el in updateKRPUSMarkerIcon:', krpusEl);

        // Ensure krpusEl is a clean container for Mapbox positioning
        krpusEl.innerHTML = ''; // Clear any existing content
        krpusEl.style.width = '24px'; // Fixed size for Mapbox positioning
        krpusEl.style.height = '24px';
        krpusEl.style.backgroundColor = 'transparent'; // Make it transparent
        krpusEl.style.border = 'none'; // No border on the outer element
        krpusEl.style.borderRadius = '0'; // No border-radius on the outer element
        krpusEl.style.cursor = 'pointer';
        krpusEl.style.boxSizing = 'border-box';
        // krpusEl.style.display = 'flex'; // Removed this line
        krpusEl.style.justifyContent = 'center';
        krpusEl.style.alignItems = 'center';
        krpusEl.style.zIndex = '9999'; // KRPUS 마커를 최상단으로

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'krpus-inner-marker'; // Add a class to target for animation
        innerWrapper.style.width = '100%'; // Fill parent (krpusEl)
        innerWrapper.style.height = '100%';
        innerWrapper.style.display = 'flex';
        innerWrapper.style.justifyContent = 'center';
        innerWrapper.style.alignItems = 'center';
        innerWrapper.style.position = 'relative'; // For animation
        innerWrapper.style.transformOrigin = 'center center'; // For animation
        innerWrapper.style.willChange = 'transform'; // For animation

        if (useVesselIcon) {
            // Apply circle and icon styles to innerWrapper
            innerWrapper.style.backgroundColor = '#FFFFFF'; // White background for the image
            innerWrapper.style.border = '2px solid #013895'; // Blue border
            innerWrapper.style.borderRadius = '50%'; // Make it a circle

            const img = document.createElement('img');
            img.src = '/images/portpredictImages/vessel_Icon.png';
            img.alt = 'Vessel Icon';
            img.style.width = '16px'; // Image size
            img.style.height = '16px';
            img.style.objectFit = 'contain';
            innerWrapper.appendChild(img);

        } else {
            krpusEl.style.width = '16px'; // Fixed size for Mapbox positioning
            krpusEl.style.height = '16px';
            // Revert to original circle style on innerWrapper
            const originalColor = krpusEl.dataset.color || '#013895'; // Use original color from dataset
            innerWrapper.style.backgroundColor = originalColor;
            innerWrapper.style.border = '2px solid #fff';
            innerWrapper.style.borderRadius = '50%';
            // Clear any image content if it was there
            innerWrapper.innerHTML = '';
        }
        krpusEl.appendChild(innerWrapper);
        console.log('KRPUS el display after updateKRPUSMarkerIcon (vessel icon): After appendChild', krpusEl.style.display);
    }

    // animateRouteDrawing 함수 추가
    window.animateRouteDrawing = function () {
        console.log('animateRouteDrawing called.');
        console.log('Current window.globalRoutesData:', window.globalRoutesData);
        if (!map || !window.globalRoutesData || window.globalRoutesData.length === 0) {
            console.warn('Map or route data not available for animation.');
            return;
        }

        const rank1Route = window.globalRoutesData.find(r => r.rank === 1);
        if (!rank1Route || !rank1Route.past_coordinates || !rank1Route.future_coordinates) {
            console.warn('Rank 1 route data not complete for animation.');
            return;
        }

        const solidCoords = rank1Route.past_coordinates;
        const dottedCoords = rank1Route.future_coordinates;
        const color = rank1Route.color; // Blue for rank 1

        const animationDuration = 8000; // 총 애니메이션 시간: 실선 6초 + 점선 2초
        const solidPartDuration = 6000; // 실선 6초
        const dottedPartDuration = 2000; // 점선 2초

        let startTime = null;
        let currentSolidIndex = 0;
        let currentDottedIndex = 0;
        let pinkMarkerShown = false;

        window.toggleMarkersVisibility(false);
        const rank1Prediction = window.globalPredictions.find(p => p.rank === 1);
        const destinationPortId = rank1Prediction ? rank1Prediction.port_id : null;
        window.showSpecificPortMarkers(['KRPUS']);

        map.getSource('route-source-rank1-solid').setData({ type: 'FeatureCollection', features: [] });
        map.getSource('route-source-rank1').setData({ type: 'FeatureCollection', features: [] });

        clearTimePointMarkers();

        const shownTimePoints = new Set();
        const fullAnimatedPath = solidCoords.concat(dottedCoords.slice(1));

        if (window.globalTimePointCoords && window.globalTimePointCoords.length > 0) {
            window.globalTimePointCoords.forEach(tpData => {
                const el = makeTimePointMarker(tpData.time_point);
                const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([tpData.lon, tpData.lat])
                    .addTo(map);
                el.style.display = 'none';

                let foundIndex = -1;
                const toleranceForMapping = 0.000001;
                for (let i = 0; i < fullAnimatedPath.length; i++) {
                    const pathLon = fullAnimatedPath[i][0];
                    const pathLat = fullAnimatedPath[i][1];
                    if (Math.abs(tpData.lat - pathLat) < toleranceForMapping && Math.abs(tpData.lon - pathLon) < toleranceForMapping) {
                        foundIndex = i;
                        break;
                    }
                }

                if (foundIndex !== -1) {
                    globalTimePointMarkerInstances.push({
                        time_point: tpData.time_point,
                        index: foundIndex,
                        markerInstance: marker,
                        element: el
                    });
                } else {
                    marker.remove();
                    console.warn(`Time point ${tpData.time_point} at [${tpData.lat}, ${tpData.lon}] not found in animated path.`);
                }
            });
        }

        const krpusCoords = portCoordsById.get('KRPUS');
        const clickZoomLevel = map.getZoom(); // Capture zoom level on click                                                                         │
        map.setMinZoom(clickZoomLevel); // Set minimum zoom for the animation  


        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;

            let currentCoords;

            if (currentSolidIndex < solidCoords.length) {
                const solidProgress = Math.min(elapsed / solidPartDuration, 1);
                const targetIndex = Math.floor(solidProgress * solidCoords.length);

                if (targetIndex > currentSolidIndex) {
                    currentSolidIndex = targetIndex;
                    const currentPath = solidCoords.slice(0, currentSolidIndex + 1);
                    map.getSource('route-source-rank1-solid').setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: { type: 'LineString', coordinates: currentPath },
                            properties: { name: 'Past Track', color: color }
                        }]
                    });


                    if (currentSolidIndex === solidCoords.length - 1 && !pinkMarkerShown) {
                        window.toggleMarkersVisibility(true);
                        pinkMarkerShown = true;
                        // ★ 추가: 현재 위치 마커(분홍색) 표시 시점에 마지막 voy-node 활성화
                        if (typeof window.setActiveVoyNode === 'function') {
                            window.setActiveVoyNode(-1); // -1은 마지막 노드를 의미
                        }
                    }
                }
                currentCoords = solidCoords[currentSolidIndex];
            }

            if (currentSolidIndex === solidCoords.length && currentDottedIndex < dottedCoords.length) {
                const dottedElapsed = elapsed - solidPartDuration;
                const dottedProgress = Math.min(dottedElapsed / dottedPartDuration, 1);
                const targetIndex = Math.floor(dottedProgress * dottedCoords.length);

                if (targetIndex > currentDottedIndex) {
                    currentDottedIndex = targetIndex;
                    const currentPath = dottedCoords.slice(0, currentDottedIndex + 1);
                    map.getSource('route-source-rank1').setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: { type: 'LineString', coordinates: currentPath },
                            properties: { name: 'Future Prediction', color: color }
                        }]
                    });
                    map.setPaintProperty('route-layer-rank1', 'line-dasharray', [0.5, 2.5]);
                }
                currentCoords = dottedCoords[currentDottedIndex];
            }

            if (krpusCoords && currentCoords) {
                const bounds = new mapboxgl.LngLatBounds();
                bounds.extend(krpusCoords);
                bounds.extend(currentCoords);

                map.fitBounds(bounds, {
                    padding: 200,
                    maxZoom: 8,
                    duration: 0
                });
            }

            globalTimePointMarkerInstances.forEach(tpMap => {
                if (!shownTimePoints.has(tpMap.time_point)) {
                    const currentOverallIndex = (currentSolidIndex < solidCoords.length)
                        ? currentSolidIndex
                        : (solidCoords.length - 1) + currentDottedIndex;

                    if (tpMap.index === currentOverallIndex) {
                        tpMap.element.style.display = '';
                        shownTimePoints.add(tpMap.time_point);

                        // ★ 추가: time_point 마커 표시 시점에 해당하는 voy-node 활성화
                        const timePointIndex = window.globalTimePointCoords.findIndex(
                            (coord) => coord.time_point === tpMap.time_point
                        );
                        if (timePointIndex !== -1 && typeof window.setActiveVoyNode === 'function') {
                            // 타임라인 노드는 [출발항, ...time_points, 현재시점] 순서이므로 +1
                            window.setActiveVoyNode(timePointIndex + 1);
                        }
                    }
                }
            });

            const currentDottedPathIndex = solidCoords.length + currentDottedIndex;
            globalTimePointMarkerInstances.forEach(tpMap => {
                if (!shownTimePoints.has(tpMap.time_point)) {
                    const currentOverallIndex = (currentSolidIndex < solidCoords.length)
                        ? currentSolidIndex
                        : (solidCoords.length - 1) + currentDottedIndex; // Adjusted for dotted path index

                    if (tpMap.index === currentOverallIndex) {
                        tpMap.element.style.display = '';
                        shownTimePoints.add(tpMap.time_point);

                        // ★ 추가: time_point 마커 표시 시점에 해당하는 voy-node 활성화
                        const timePointIndex = window.globalTimePointCoords.findIndex(
                            (coord) => coord.time_point === tpMap.time_point
                        );
                        if (timePointIndex !== -1 && typeof window.setActiveVoyNode === 'function') {
                            // 타임라인 노드는 [출발항, ...time_points, 현재시점] 순서이므로 +1
                            window.setActiveVoyNode(timePointIndex + 1);
                        }
                    }
                }
            });

            if (currentSolidIndex < solidCoords.length || currentDottedIndex < dottedCoords.length) {
                requestAnimationFrame(animate);
            } else {
                map.getSource('route-source-rank1-solid').setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: solidCoords },
                        properties: { name: 'Past Track', color: color }
                    }]
                });
                map.getSource('route-source-rank1').setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: dottedCoords },
                        properties: { name: 'Future Prediction', color: color }
                    }]
                });
                map.setPaintProperty('route-layer-rank1', 'line-dasharray', [0.5, 2.5]);

                if (destinationPortId) {
                    window.showSpecificPortMarkers(['KRPUS', destinationPortId]);
                }
                map.setMinZoom(0);
            }
        }

        requestAnimationFrame(animate);
    };

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
            el.dataset.color = color; // Store original color

            markerElByPortId.set(portId, el);
            portCoordsById.set(portId, { lng, lat });

            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 180);
                if (!portId) return;
                window.location.assign(`/port/info?port=${encodeURIComponent(portId)}`);
            });

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

            const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom', offset: [0, 0] })
                .setLngLat([lng, lat])
                .addTo(map);

            allPortMarkers.push(marker);
        });
    }

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

    map.on('load', async () => {

        map.getStyle().layers
            .filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label')))
            .forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));

        map.addSource('arrived-route-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'arrived-route-layer', type: 'line', source: 'arrived-route-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4 }
        });

        map.addSource(routeSourceId_rank3, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: routeLayerId_rank3, type: 'line', source: routeSourceId_rank3,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] }
        });

        map.addSource(routeSourceId_rank2, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: routeLayerId_rank2, type: 'line', source: routeSourceId_rank2,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] }
        });

        map.addSource('route-source-rank1-solid', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'route-layer-rank1-solid',
            type: 'line',
            source: 'route-source-rank1-solid',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': ['get', 'color'], 'line-width': 4 }
        });

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

        await addPortMarkers().catch(console.error);

        try { await updateCongestion(); } catch (e) { console.error(e); }

        const busanEl = makeCircleMarker({ color: '#013895' });
        busanEl.dataset.portId = 'KRPUS';
        const busanMarker = new mapboxgl.Marker({ element: busanEl, anchor: 'bottom', offset: [0, 0] })
            .setLngLat([129.040, 35.106]).addTo(map);
        allPortMarkers.push(busanMarker);
        markerElByPortId.set('KRPUS', busanEl);
        portCoordsById.set('KRPUS', { lng: 129.040, lat: 35.106 });
        window.markerInstanceByPortId.set('KRPUS', busanMarker); // Store the marker instance
        busanEl.addEventListener('mouseenter', async () => {
            if (!isKrpusHoverEnabled) return; // 호버 비활성화 시 동작 안 함
            busanHoverPopup.setLngLat([129.040, 35.106]).setHTML(`<div class="port-hover-card busan-hover-card"><div class="port-hover-card__hd">부산</div></div>`).addTo(map);
        });
        busanEl.addEventListener('mouseleave', () => {
            if (!isKrpusHoverEnabled) return; // 호버 비활성화 시 동작 안 함
            busanHoverPopup.remove();
        });
        busanEl.addEventListener('click', () => {
            if (typeof window.toggleKrpusPulseAnimation === 'function') {
                window.toggleKrpusPulseAnimation(false);
            }
            console.log('KRPUS marker clicked. Attempting route animation.');
            // 새로운 항로 애니메이션 함수 호출
            if (typeof window.animateRouteDrawing === 'function') {
                window.animateRouteDrawing();
            }
        });

        console.log('KRPUS busanEl created:', busanEl);
        console.log('KRPUS in markerElByPortId:', markerElByPortId.get('KRPUS'));
        console.log('KRPUS marker display style after creation:', busanEl.style.display);

        isInitialStyleLoad = false;
    });

    map.on('style.load', () => {
        if (isInitialStyleLoad) {
            return;
        }

        map.addSource('arrived-route-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'arrived-route-layer', type: 'line', source: 'arrived-route-source', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
        map.addSource(routeSourceId_rank3, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: routeLayerId_rank3, type: 'line', source: routeSourceId_rank3, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] } });
        map.addSource(routeSourceId_rank2, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: routeLayerId_rank2, type: 'line', source: routeSourceId_rank2, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] } });
        map.addSource('route-source-rank1-solid', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'route-layer-rank1-solid', type: 'line', source: 'route-source-rank1-solid', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
        map.addSource(routeSourceId_rank1, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: routeLayerId_rank1, type: 'line', source: routeSourceId_rank1, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [0.5, 2.5] } });
        map.addSource(markerSourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: markerLayerId, type: 'circle', source: markerSourceId, paint: { 'circle-radius': 10, 'circle-color': '#e6ebf0', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#e6ebf0' } });

        allPortMarkers.forEach(marker => marker.addTo(map));

        if (lastDrawnRoutes) {
            window.drawRoutes(lastDrawnRoutes);
        }
        if (lastDrawnMarkers && lastDrawnLastMarker) {
            window.drawMarkers(lastDrawnMarkers, lastDrawnLastMarker);
        }

        markerElByPortId.forEach(el => {
            const ring = el.querySelector('.cong-ring');
            if (ring) ring.style.display = congestionVisible ? '' : 'none';
            const emoji = el.querySelector('.weather-emoji');
            if (emoji) emoji.style.display = weatherVisible ? '' : 'none';
        });

        map.setProjection('mercator');
        map.getStyle().layers.filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label'))).forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));
    });

    window.drawRoutes = function (routes) {
        if (!map) return;
        lastDrawnRoutes = routes;

        const featuresRank1Solid = [];
        const featuresRank1Dotted = [];
        const featuresRank2 = [];
        const featuresRank3 = [];
        const featuresArrived = [];

        routes.forEach(r => {
            if (r.route_name === '도착 항로') {
                featuresArrived.push({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: r.coordinates },
                    properties: { name: r.route_name, color: r.color }
                });
            } else if (r.rank === 1) {
                if (r.past_coordinates && r.past_coordinates.length > 1) {
                    featuresRank1Solid.push({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: r.past_coordinates },
                        properties: { name: r.route_name, color: r.color }
                    });
                }
                if (r.future_coordinates && r.future_coordinates.length > 1) {
                    featuresRank1Dotted.push({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: r.future_coordinates },
                        properties: { name: r.route_name, color: r.color }
                    });
                }
            } else if (r.rank === 2 || r.rank === 3) {
                const feature = {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: r.coordinates },
                    properties: { name: r.route_name, color: r.color }
                };
                if (r.rank === 2) featuresRank2.push(feature);
                else featuresRank3.push(feature);
            }
        });

        if (map.getSource('arrived-route-source')) map.getSource('arrived-route-source').setData({ type: 'FeatureCollection', features: featuresArrived });
        if (map.getSource('route-source-rank1-solid')) map.getSource('route-source-rank1-solid').setData({ type: 'FeatureCollection', features: featuresRank1Solid });
        if (map.getSource(routeSourceId_rank1)) map.getSource(routeSourceId_rank1).setData({ type: 'FeatureCollection', features: featuresRank1Dotted });
        if (map.getSource(routeSourceId_rank2)) map.getSource(routeSourceId_rank2).setData({ type: 'FeatureCollection', features: featuresRank2 });
        if (map.getSource(routeSourceId_rank3)) map.getSource(routeSourceId_rank3).setData({ type: 'FeatureCollection', features: featuresRank3 });
    };

    window.drawMarkers = function (markers, lastMarkerData) {
        if (!map) return;
        lastDrawnMarkers = markers;
        lastDrawnLastMarker = lastMarkerData;

        const feats = markers.map(m => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: m.coordinates },
            properties: { description: m.description }
        }));
        if (map.getSource(markerSourceId)) {
            map.getSource(markerSourceId).setData({ type: 'FeatureCollection', features: feats });
        }

        if (lastPositionMarker) {
            lastPositionMarker.remove();
            lastPositionMarker = null;
        }

        if (lastMarkerData && lastMarkerData.coordinates) {
            const el = document.createElement('div');
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.backgroundColor = '#FDDDE6';
            el.style.borderRadius = '50%';
            el.style.boxShadow = '0 0 0 3px rgba(253, 221, 230, 0.7)';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
            el.style.cursor = 'pointer';

            const arrow = document.createElement('div');
            arrow.style.width = '0';
            arrow.style.height = '0';
            arrow.style.borderLeft = '5px solid transparent';
            arrow.style.borderRight = '5px solid transparent';
            arrow.style.borderBottom = '10px solid red';
            el.appendChild(arrow);

            const cog = lastMarkerData.cog || 0;
            arrow.style.transform = `rotate(${cog}deg)`;

            el.addEventListener('mouseenter', async () => {
                const [lon, lat] = lastMarkerData.coordinates;
                const targetISO = (typeof window.lastVesselTsISO === 'string' && window.lastVesselTsISO) ? window.lastVesselTsISO : new Date().toISOString();
                try {
                    const env = await window.ajaxEnvAt(lat, lon, targetISO);
                    const html = window.buildEnvPopupHTML(env);
                    marineHoverPopup.setLngLat([lon, lat]).setHTML(html).addTo(map);
                } catch (err) { console.error('hover env fail', err); }
            });
            el.addEventListener('mouseleave', () => {
                marineHoverPopup.remove();
            });

            lastPositionMarker = new mapboxgl.Marker(el)
                .setLngLat(lastMarkerData.coordinates)
                .addTo(map);
        }
    };

    window.toggleMarkersVisibility = function (isVisible) {
        console.log('toggleMarkersVisibility called with isVisible:', isVisible);
        if (!map) return;
        const displayStyle = isVisible ? 'flex' : 'none'; // Use 'flex' when visible, 'none' when hidden
        if (map.getLayer(markerLayerId)) {
            map.setLayoutProperty(markerLayerId, 'visibility', isVisible ? 'visible' : 'none'); // Keep this for other circle markers
        }
        if (lastPositionMarker) {
            lastPositionMarker.getElement().style.display = displayStyle; // Change to display
            console.log(`Pink marker new display: ${lastPositionMarker.getElement().style.display}`);
        }
    };

    window.togglePortMarkersByRank = function (ranksToKeep) {
        console.log('togglePortMarkersByRank called with ranksToKeep:', ranksToKeep);
        const portIdsToKeep = new Set(globalPredictions.filter(p => ranksToKeep.includes(p.rank)).map(p => p.port_id));
        console.log('portIdsToKeep:', portIdsToKeep);
        const isAnyRankActive = ranksToKeep.length > 0; // Check if any rank is active
        console.log('isAnyRankActive:', isAnyRankActive);

        // ▼ [수정] 1순위가 비활성화되면 라벨 제거
        if (!ranksToKeep.includes(1)) {
            window.removeDestinationLabel();
        }

        for (const [portId, el] of markerElByPortId.entries()) {
            console.log(`Processing portId: ${portId}, current display: ${el.style.display}`);
            if (portId === 'KRPUS') {
                el.style.display = isAnyRankActive ? '' : 'none'; // KRPUS visible only if any rank is active
                console.log(`KRPUS new display: ${el.style.display}`);
                updateKRPUSMarkerIcon(isAnyRankActive); // Apply vessel icon if any rank is active, else circle
            } else if (portIdsToKeep.has(portId)) {
                el.style.display = ''; // Destination port visible if its rank is active
                console.log(`Destination port ${portId} new display: ${el.style.display}`);
                const prediction = globalPredictions.find(p => p.port_id === portId);
                updatePortMarkerIcon(portId, true, prediction?.rank);

                // ▼ [수정] 1순위 항구인 경우 라벨 표시
                if (prediction?.rank === 1) {
                    const coords = portCoordsById.get(portId);
                    if (coords) {
                        window.updateDestinationLabel(portId, 1, coords.lng, coords.lat);
                    }
                }
            } else {
                el.style.display = 'none'; // Hide other ports
                console.log(`Other port ${portId} new display: ${el.style.display}`);
            }
        }
    };

    window.showSpecificPortMarkers = function (portIdsToShow) {
        console.log('showSpecificPortMarkers called with portIdsToShow:', portIdsToShow);
        const idSet = new Set(portIdsToShow);
        allPortMarkers.forEach(m => {
            const el = m.getElement();
            const id = el.dataset.portId;
            if (id) {
                if (idSet.has(id)) {
                    el.style.display = ''; // Show
                    if (id === 'KRPUS') {
                        console.log('KRPUS marker found in showSpecificPortMarkers. Current display:', el.style.display, 'classList:', el.classList.value);
                        updateKRPUSMarkerIcon(true); // Vessel icon for KRPUS
                        console.log('KRPUS marker display set to empty string. New display:', el.style.display);
                    } else {
                        // For other specific ports, use dest_icon.svg with rank 1 color
                        updatePortMarkerIcon(id, true, 1);
                    }
                } else {
                    el.style.display = 'none'; // Hide
                    if (id === 'KRPUS') { console.log('KRPUS marker hidden in showSpecificPortMarkers.'); }
                }
            }
        });
    };

    window.hideAllPortMarkers = function () {
        allPortMarkers.forEach(m => {
            if (m.getElement().dataset.portId !== 'KRPUS') m.getElement().style.display = 'none';
        });
    };
    window.showAllPortMarkers = function () {
        allPortMarkers.forEach(m => {
            const el = m.getElement();
            el.style.display = '';
            const portId = el.dataset.portId;
            if (portId === 'KRPUS') {
                updateKRPUSMarkerIcon(false); // Revert KRPUS to circle
            } else if (portId) {
                updatePortMarkerIcon(portId, false); // Revert other ports to circle
            }
        });
    };

    window.clearRoutesAndMarkers = function () {
        if (!map) return;
        const empty = { type: 'FeatureCollection', features: [] };
        if (map.getSource('arrived-route-source')) map.getSource('arrived-route-source').setData(empty);
        if (map.getSource('route-source-rank1-solid')) map.getSource('route-source-rank1-solid').setData(empty);
        if (map.getSource(routeSourceId_rank1)) map.getSource(routeSourceId_rank1).setData(empty);
        if (map.getSource(routeSourceId_rank2)) map.getSource(routeSourceId_rank2).setData(empty);
        if (map.getSource(routeSourceId_rank3)) map.getSource(routeSourceId_rank3).setData(empty);
        if (map.getSource(markerSourceId)) map.getSource(markerSourceId).setData(empty);

        if (lastPositionMarker) {
            lastPositionMarker.remove();
            lastPositionMarker = null;
        }

        lastDrawnRoutes = null;
        lastDrawnMarkers = null;
        lastDrawnLastMarker = null;

        // NEW: Clear time point markers
        clearTimePointMarkers();
        // ▼ [추가] 도착 항구 라벨 제거
        window.removeDestinationLabel();
    };

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

        const busanCoords = portCoordsById.get('KRPUS');
        if (busanCoords) {
            bounds.extend([busanCoords.lng, busanCoords.lat]);
        }

        map.fitBounds(bounds, {
            padding: { top: 150, bottom: 110, left: 450, right: 110 }, // 사이드바 고려하여 패딩 조정
            maxZoom: 10,
            duration: 1000
        });
    }

    document.querySelector('.sidebar__btn.primary').addEventListener('click', () => {
        setTimeout(fitMapViewToTopPorts, 500);
    });

    window.fitMapViewToSpecificPorts = function (portIds) {
        if (!portCoordsById || portIds.length === 0) return;

        const bounds = new mapboxgl.LngLatBounds();
        portIds.forEach(portId => {
            const coords = portCoordsById.get(portId);
            if (coords) {
                bounds.extend([coords.lng, coords.lat]);
            }
        });

        if (bounds.isEmpty()) return; // No valid coordinates found

        map.fitBounds(bounds, {
            padding: { top: 130, bottom: 110, left: 450, right: 110 }, // Adjust padding as needed
            maxZoom: 10,
            duration: 1000
        });
    };

    window.resetMapViewToInitialState = function () {
        map.flyTo({
            center: [127.05, 33.13],
            zoom: 5.5,
            duration: 1000 // Optional: smooth transition
        });
    };

    // New: Function to clear time point markers
    function clearTimePointMarkers() {
        globalTimePointMarkerInstances.forEach(markerObj => markerObj.markerInstance.remove());
        globalTimePointMarkerInstances = [];
    }

    window.toggleKrpusPulseAnimation = function (enable) {
        console.log('toggleKrpusPulseAnimation called with enable:', enable);
        const krpusEl = markerElByPortId.get('KRPUS');
        if (krpusEl) {
            const innerMarker = krpusEl.querySelector('.krpus-inner-marker');
            if (innerMarker) { // Only apply to inner wrapper if it exists (i.e., vessel icon is active)
                if (enable) {
                    innerMarker.classList.add('is-pulsing');
                } else {
                    innerMarker.classList.remove('is-pulsing');
                }
                console.log('KRPUS innerMarker classList after animation toggle:', innerMarker.classList.value);
            }
        }
    };

    window.toggleKrpusHover = function (enable) {
        isKrpusHoverEnabled = enable;
    };
});