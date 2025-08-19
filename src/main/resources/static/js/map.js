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

    const routeSourceId = 'route-source';
    const routeLayerId = 'route-layer';
    const markerSourceId = 'marker-source';
    const markerLayerId = 'marker-layer';
    const lastMarkerSourceId = 'last-marker-source';
    const lastMarkerLayerId = 'last-marker-layer';
    let allPortMarkers = [];
    let congestionMarkers = [];

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '340px',
        offset: 35
    });

    const busanHoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '90px',
        offset: 35,
        anchor: 'bottom',
        className: 'busan-popup-container'
    });

    const marineHoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: 16
    });

    const hoverCache = new Map();
    const HOVER_TTL_MS = 60000;

    async function fetchHoverDTO(portId) {
        const now = Date.now();
        const cached = hoverCache.get(portId);
        if (cached && (now - cached.t) < HOVER_TTL_MS) return cached.v;
        const res = await fetch(`/api/info/hover/${encodeURIComponent(portId)}`, {
            cache: 'no-cache'
        });
        if (!res.ok) throw new Error('hover API 실패: ' + portId);
        const data = await res.json();
        hoverCache.set(portId, {
            t: now,
            v: data
        });
        return data;
    }

    function mapHoverDtoToCardParams(dto) {
        const w = dto.weather || {};
        const dock = dto.docking || {};
        const tz = dto.timezone || {};
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

    function degToCompass16(deg) {
        const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
        ];
        const i = Math.round(((deg % 360) / 22.5)) % 16;
        return dirs[i];
    }

    function bearingToText(deg) {
        const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
        return dirs[Math.round((((deg % 360) + 360) % 360) / 45)];
    }

    function buildMarinePopupHTML(d) {
        const waveDirectionText = bearingToText(d.waveDirection);
        const currentDirectionText = bearingToText(d.currentDirection);
        return `
            <div class="marine-popup">
                <div class="marine-popup__item">
                    <span class="marine-popup__label">파고</span>
                    <span class="marine-popup__value">${d.waveHeight}m</span>
                </div>
                <div class="marine-popup__item">
                    <span class="marine-popup__label">파향</span>
                    <span class="marine-popup__value">${d.waveDirection}° <span class="subtle">(${waveDirectionText})</span></span>
                </div>
                <div class="marine-popup__item">
                    <span class="marine-popup__label">표층 수온</span>
                    <span class="marine-popup__value">${d.seaSurfaceTemp}°C</span>
                </div>
                <div class="marine-popup__item">
                    <span class="marine-popup__label">유속</span>
                    <span class="marine-popup__value">${d.currentVelocity}m/s</span>
                </div>
                <div class="marine-popup__item">
                    <span class="marine-popup__label">유향</span>
                    <span class="marine-popup__value">${d.currentDirection}° <span class="subtle">(${currentDirectionText})</span></span>
                </div>
                <div class="marine-popup__item">
                    <span class="marine-popup__label">시정</span>
                    <span class="marine-popup__value">${d.visibilityKm}km</span>
                </div>
                <div class="marine-popup__item">
                    <span class="marine-popup__label">날씨</span>
                    <span class="marine-popup__value">${d.weatherText}</span>
                </div>
            </div>`;
    }

    function buildPopupHTML(d) {
        return `
    <div class="marine-popup">
      <div class="header">
        <svg class="icon" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s7-6.28 7-12a7 7 0 1 0-14 0c0 5.72 7 12 7 12z" stroke="#fff" stroke-width="2" fill="none"/>
          <circle cx="12" cy="10" r="3" fill="#fff"/>
        </svg>
        <span>사용자 현위치</span>
      </div>
    
      <div class="body">
        <div class="row">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M3 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" stroke="#1d4ed8" stroke-width="2" fill="none" stroke-linecap="round"/>
          </svg>
          <div class="label">파고</div>
          <div class="value">${d.waveHeight.toFixed(1)} m</div>
        </div>
    
        <div class="row">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M5 12h10" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 7l5 5-5 5" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="label">파도방향</div>
          <div class="value">
            ${Math.round(d.waveDirection)}°
            <span class="sub">(${bearingToText(d.waveDirection)})</span>
          </div>
        </div>
    
        <div class="row">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M4 12c2 0 3-2 5-2s3 2 5 2 3-2 5-2" stroke="#0ea5e9" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M13 7l5 5-5 5" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="label">해류</div>
          <div class="value">
            ${d.currentVelocity.toFixed(1)} m/s
            <span class="sub">(${bearingToText(d.currentDirection)}쪽)</span>
          </div>
        </div>
    
        <div class="row">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M12 3v10a4 4 0 1 0 4 4" stroke="#ef4444" stroke-width="2" fill="none" stroke-linecap="round"/>
            <circle cx="12" cy="18" r="2" fill="#ef4444"/>
          </svg>
          <div class="label">해수온도</div>
          <div class="value">${d.seaSurfaceTemp.toFixed(1)} °C</div>
        </div>
    
        <div class="row">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="none" stroke="#2563eb" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#2563eb"/>
          </svg>
          <div class="label">가시거리</div>
          <div class="value">${d.visibilityKm.toFixed(1)} km</div>
        </div>
    
        <div class="row">
          <svg class="icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" fill="#fbbf24"/>
            <g stroke="#fbbf24" stroke-width="2">
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.2 2.2M17.6 17.6l2.2 2.2M17.6 6.4l2.2-2.2M4.2 19.8l2.2-2.2"/>
            </g>
          </svg>
          <div class="label">날씨</div>
          <div class="value">${d.weatherText}</div>
        </div>
      </div>
    </div>`;
    }

    function buildPortHoverCardHTML({ portId, windSpdMS, windDirDeg, tempC, congestion, tzText }) {
        const dirLabel = degToCompass16(windDirDeg || 0);
        const congClass = congestion === 'high' ? 'cong--high' :
            congestion === 'mid' ? 'cong--mid' :
                'cong--low';
        const congText = congestion === 'high' ? '매우 혼잡' :
            congestion === 'mid' ? '보통' :
                '원활';

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

    function buildBusanHoverCardHTML() {
        return `
    <div class="port-hover-card busan-hover-card">
      <div class="port-hover-card__hd">
        KRBUS
      </div>
    </div>`;
    }

    async function loadSvgText(url) {
        const res = await fetch(url, {
            cache: 'no-cache'
        });
        if (!res.ok) throw new Error('SVG 로드 실패: ' + url);
        return await res.text();
    }

    function makeSvgMarker(svgText, {
        color = '#0ea5e9',
        size = 28
    } = {}) {
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

    // 혼잡도를 원으로 표시하도록 수정된 함수
    async function createCongestionMarkers(geojson, congestionData) {
        geojson.features.forEach(f => {
            if (!f.geometry || f.geometry.type !== 'Point') return;
            const [lng, lat] = f.geometry.coordinates || [];
            if (typeof lng !== 'number' || typeof lat !== 'number') return;
            const portId = f.properties?.port_id || '';

            if (portId === 'KRBUS') return;

            const portCongestion = congestionData[portId] || {};
            const congLevel = (portCongestion.congestionLevel || '원활').trim();
            let congColor;
            let size = 12;

            if (congLevel === '매우 혼잡') {
                congColor = '#e74c3c'; // 빨간색
                size = 40; // ⭐ 이 값을 원하는 크기로 변경하세요 (예: 20)
            } else if (congLevel === '혼잡') {
                congColor = '#f39c12'; // 주황색
                size = 30; // ⭐ 이 값을 원하는 크기로 변경하세요 (예: 15)
            } else {
                congColor = '#2ecc71'; // 초록색
                size = 20; // ⭐ 이 값을 원하는 크기로 변경하세요 (예: 10)
            }

            const congestionCircle = document.createElement('div');
            congestionCircle.className = 'port-congestion-circle';
            congestionCircle.style.width = `${size}px`;
            congestionCircle.style.height = `${size}px`;
            congestionCircle.style.borderRadius = '50%'; // 원 모양으로 만듭니다
            congestionCircle.style.backgroundColor = congColor;
            congestionCircle.style.border = '2px solid #fff'; // 흰색 테두리 추가

            const marker = new mapboxgl.Marker({
                element: congestionCircle,
                anchor: 'center' // 원의 중심에 마커가 위치하도록 변경
            })
                .setLngLat([lng, lat])
                .addTo(map);

            congestionMarkers.push(marker);
        });
    }

    async function addPortMarkers() {
        const SVG_URL = '/images/portpredictImages/port_icon.svg';
        const [svgText, geojson] = await Promise.all([
            loadSvgText(SVG_URL),
            fetch('/data/ports.geojson', {
                cache: 'no-cache'
            }).then(r => {
                if (!r.ok) throw new Error('ports.geojson 로드 실패');
                return r.json();
            })
        ]);

        geojson.features.forEach(f => {
            if (!f.geometry || f.geometry.type !== 'Point') return;
            const [lng, lat] = f.geometry.coordinates || [];
            if (typeof lng !== 'number' || typeof lat !== 'number') return;
            const portId = f.properties?.port_id || '';

            const size = f.properties?.size || 28;
            const el = makeSvgMarker(svgText, {
                color: f.properties?.color || '#013895',
                size
            });

            el.dataset.portId = portId;

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat([lng, lat])
                .addTo(map);

            allPortMarkers.push(marker);

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
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 180);
                if (!portId) return;
                window.location.assign(`/port/info?port=${encodeURIComponent(portId)}`);
            });
        });
    }

    map.on('load', async () => {
        map.getStyle().layers
            .filter(l => l.type === 'symbol' && (l.id.includes('poi-label') || l.id.includes('harbor-label')))
            .forEach(l => map.setLayoutProperty(l.id, 'visibility', 'none'));

        map.addSource(routeSourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        map.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': ['get', 'color'],
                'line-width': 4
            }
        });

        map.addSource(markerSourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        map.addLayer({
            id: markerLayerId,
            type: 'circle',
            source: markerSourceId,
            paint: {
                'circle-radius': 6,
                'circle-color': '#34495e',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

        map.addSource(lastMarkerSourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        map.addLayer({
            id: lastMarkerLayerId,
            type: 'circle',
            source: lastMarkerSourceId,
            paint: {
                'circle-radius': 8,
                'circle-color': '#00bfff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        });

        await addPortMarkers().catch(console.error);

        const SVG_URL = '/images/portpredictImages/port_icon.svg';
        const svgText = await loadSvgText(SVG_URL);
        const busanEl = makeSvgMarker(svgText, {
            color: '#013895',
            size: 28
        });
        busanEl.dataset.portId = 'KRBUS';

        busanEl.addEventListener('mouseenter', () => {
            const html = buildBusanHoverCardHTML();
            busanHoverPopup.setLngLat([129.040, 35.106]).setHTML(html).addTo(map);
        });

        busanEl.addEventListener('mouseleave', () => {
            busanHoverPopup.remove();
        });

        const busanMarker = new mapboxgl.Marker({
            element: busanEl,
            anchor: 'bottom'
        })
            .setLngLat([129.040, 35.106])
            .addTo(map);

        allPortMarkers.push(busanMarker);

        let hoverTimeout;
        const marineData = {
            waveHeight: 1.2,
            waveDirection: 210,
            seaSurfaceTemp: 27.5,
            currentVelocity: 0.4,
            currentDirection: 90,
            visibilityKm: 10.0,
            weatherText: "맑음"
        };
        map.on('mouseenter', lastMarkerLayerId, (e) => {
            clearTimeout(hoverTimeout);
            const coordinates = e.features[0].geometry.coordinates.slice();
            const html = buildPopupHTML(marineData);
            marineHoverPopup.setLngLat(coordinates).setHTML(html).addTo(map);
        });
        map.on('mouseleave', lastMarkerLayerId, () => {
            hoverTimeout = setTimeout(() => {
                marineHoverPopup.remove();
            }, 100);
        });

        const congestionBtn = document.getElementById('congestion-btn');
        if (congestionBtn) {
            let isCongestionVisible = false;
            congestionBtn.addEventListener('click', async () => {
                isCongestionVisible = !isCongestionVisible;
                congestionBtn.setAttribute('aria-pressed', isCongestionVisible.toString());

                if (isCongestionVisible) {
                    const geojson = await fetch('/data/ports.geojson', { cache: 'no-cache' }).then(r => r.json());
                    const congestionData = await fetch('/api/info/all-port-congestion', { cache: 'no-cache' }).then(r => r.json());
                    await createCongestionMarkers(geojson, congestionData);
                } else {
                    congestionMarkers.forEach(marker => marker.remove());
                    congestionMarkers = [];
                }
            });
        }
    });

    window.drawRoutes = function (routes) {
        if (!map || !map.getSource(routeSourceId)) return;
        const routeFeatures = routes.map(route => ({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: route.coordinates
            },
            properties: {
                name: route.route_name,
                color: route.color
            }
        }));
        map.getSource(routeSourceId).setData({
            type: 'FeatureCollection',
            features: routeFeatures
        });
    };

    window.drawMarkers = function (markers, lastMarker) {
        if (!map || !map.getSource(markerSourceId) || !map.getSource(lastMarkerSourceId)) return;
        const markerFeatures = markers.map(marker => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: marker.coordinates
            },
            properties: {
                description: marker.description
            }
        }));
        map.getSource(markerSourceId).setData({
            type: 'FeatureCollection',
            features: markerFeatures
        });
        const lastMarkerFeature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: lastMarker.coordinates
            },
            properties: {
                description: lastMarker.description
            }
        };
        map.getSource(lastMarkerSourceId).setData({
            type: 'FeatureCollection',
            features: [lastMarkerFeature]
        });
    };

    window.toggleMarkersVisibility = function (isVisible) {
        if (!map || !map.getLayer(markerLayerId) || !map.getLayer(lastMarkerLayerId)) return;
        const visibility = isVisible ? 'visible' : 'none';
        map.setLayoutProperty(markerLayerId, 'visibility', visibility);
        map.setLayoutProperty(lastMarkerLayerId, 'visibility', visibility);
    };

    window.togglePortMarkersByRank = function (ranksToKeep) {
        const portIdsToKeep = new Set(globalPredictions.filter(p => ranksToKeep.includes(p.rank)).map(p => p.port_id));
        portIdsToKeep.add('KRBUS');

        allPortMarkers.forEach(marker => {
            const portId = marker.getElement().dataset.portId;
            if (portIdsToKeep.has(portId)) {
                marker.getElement().style.display = '';
            } else {
                marker.getElement().style.display = 'none';
            }
        });
    };

    window.hideAllPortMarkers = function () {
        allPortMarkers.forEach(marker => {
            const portId = marker.getElement().dataset.portId;
            if (portId !== 'KRBUS') {
                marker.getElement().style.display = 'none';
            }
        });
    };

    window.showAllPortMarkers = function () {
        allPortMarkers.forEach(marker => {
            marker.getElement().style.display = '';
        });
    };

    window.clearRoutesAndMarkers = function () {
        if (!map || !map.getSource(routeSourceId)) return;
        const emptyGeojson = {
            type: 'FeatureCollection',
            features: []
        };
        map.getSource(routeSourceId).setData(emptyGeojson);
        map.getSource(markerSourceId).setData(emptyGeojson);
        map.getSource(lastMarkerSourceId).setData(emptyGeojson);
        window.toggleMarkersVisibility(false);
    };
});