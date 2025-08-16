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
    let allPortMarkers = []; // 모든 항구 마커를 저장할 배열

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
            const portId = f.properties?.port_id || ''; // port_id 추출

            const color = f.properties?.color || '#013895';
            const size = f.properties?.size || 28;

            const el = makeSvgMarker(svgText, {
                color,
                size
            });

            // DOM 엘리먼트에 port_id 저장
            el.dataset.portId = portId;

            el.addEventListener('click', () => {
                el.classList.add('bump');
                setTimeout(() => el.classList.remove('bump'), 180);

                if (!portId) return;

                new mapboxgl.Popup()
                    .setLngLat([lng, lat])
                    .setHTML(`<div style="font-weight:700">${portId}</div><div style="font-size:12px;color:#666">(${lat.toFixed(4)}, ${lng.toFixed(4)})</div>`)
                    .addTo(map);

                setTimeout(() => {
                    window.location.href = `/port/info?port=${encodeURIComponent(portId)}`;
                }, 1000);
            });

            const marker = new mapboxgl.Marker({ // 마커 인스턴스 저장
                element: el,
                anchor: 'bottom'
            })
                .setLngLat([lng, lat])
                .addTo(map);

            allPortMarkers.push(marker); // 마커를 배열에 저장

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
                'line-color': ['get', 'color'], // GeoJSON feature의 'color' 속성 값을 사용하도록 변경
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
                'circle-color': '#34495e', // timeline 마커 색상 (짙은 청회색)
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
                'circle-color': '#00bfff', // latest 마커 색상 (짙은 빨간색)
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
        busanEl.dataset.portId = 'KRBUS'; // 부산 마커에도 ID 부여

        busanEl.addEventListener('mouseenter', () => {
            const html = buildBusanHoverCardHTML();
            busanHoverPopup.setLngLat([129.040, 35.106]).setHTML(html).addTo(map);
        });

        busanEl.addEventListener('mouseleave', () => {
            busanHoverPopup.remove();
        });

        const busanMarker = new mapboxgl.Marker({ // 부산 마커를 배열에 저장
            element: busanEl,
            anchor: 'bottom'
        })
            .setLngLat([129.040, 35.106])
            .addTo(map);

        allPortMarkers.push(busanMarker); // 부산 마커를 배열에 저장
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
                color: route.color // portpredict.js에서 넘어온 color 속성을 GeoJSON에 추가
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

    // 마커 레이어의 가시성을 제어합니다.
    window.toggleMarkersVisibility = function (isVisible) {
        if (!map || !map.getLayer(markerLayerId) || !map.getLayer(lastMarkerLayerId)) return;
        const visibility = isVisible ? 'visible' : 'none';
        map.setLayoutProperty(markerLayerId, 'visibility', visibility);
        map.setLayoutProperty(lastMarkerLayerId, 'visibility', visibility);
    };

    // 활성화된 랭크에 해당하는 항구 마커만 표시
    window.togglePortMarkersByRank = function (ranksToKeep) {
        const portIdsToKeep = new Set(globalPredictions.filter(p => ranksToKeep.includes(p.rank)).map(p => p.port_id));
        portIdsToKeep.add('KRBUS'); // 부산항은 항상 유지

        allPortMarkers.forEach(marker => {
            const portId = marker.getElement().dataset.portId;
            if (portIdsToKeep.has(portId)) {
                marker.getElement().style.display = '';
            } else {
                marker.getElement().style.display = 'none';
            }
        });
    };

    // 모든 항구 마커 숨기기 (부산항 제외)
    window.hideAllPortMarkers = function () {
        allPortMarkers.forEach(marker => {
            const portId = marker.getElement().dataset.portId;
            if (portId !== 'KRBUS') {
                marker.getElement().style.display = 'none';
            }
        });
    };

    // 모든 항구 마커 다시 표시
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