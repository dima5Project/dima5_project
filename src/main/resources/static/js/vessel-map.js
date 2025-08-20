/* ============================
   vessel-map.js (최종)
   - /api/predict?{mmsi|imo}=ID 로 조회
   - latest / timeline / tracks_topk 지도 반영
   - 클릭 시 Open‑Meteo(env-api.js)로 환경데이터 팝업
   - map.js가 만든 window.appMap 사용 (window.appMap = map;)
   ============================ */
(function () {
    'use strict';

    // ---- 유틸 ----
    function ensureSource(map, id, data) {
        if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data });
        else map.getSource(id).setData(data);
    }
    function toFC(features) {
        return { type: 'FeatureCollection', features };
    }

    function ensureVesselLayers(map) {
        if (!map.getLayer('vessel-point')) {
            map.addLayer({
                id: 'vessel-point',
                type: 'symbol',
                source: 'vessel-current',
                layout: {
                    'icon-image': 'harbor-15',
                    'icon-rotate': ['get', 'cog'],
                    'icon-allow-overlap': true,
                    'icon-size': 1.2
                }
            });
        }
        if (!map.getLayer('vessel-track')) {
            map.addLayer({
                id: 'vessel-track',
                type: 'line',
                source: 'vessel-track',
                paint: { 'line-color': '#1e90ff', 'line-width': 2 }
            });
        }
        [
            ['pred-1', '#FF6B6B'],
            ['pred-2', '#FFA94D'],
            ['pred-3', '#74C0FC']
        ].forEach(([id, color]) => {
            if (!map.getLayer(id)) {
                map.addLayer({
                    id,
                    type: 'line',
                    source: id,
                    paint: { 'line-color': color, 'line-width': 2, 'line-dasharray': [2, 2] }
                });
            }
        });
    }

    // 입력 읽기
    function getSelectedIdType() {
        // 커스텀 셀렉트의 data-value 또는 텍스트
        const el = document.querySelector('.cselect[data-name="idType"] .cselect__value');
        const v = el?.getAttribute('data-value') || el?.textContent || 'MMSI';
        return (v || 'MMSI').toUpperCase(); // 'MMSI' | 'IMO'
    }
    function getVesselIdInput() {
        // 기본: 사이드바 입력, 없으면 기존 #mmsiInput fallback
        const input = document.querySelector('.sidebar__input') || document.querySelector('#mmsiInput');
        return (input?.value || '').trim();
    }

    // 팝업(환경데이터) 바인딩
    function bindVesselPopup(map) {
        if (bindVesselPopup._bound) return;
        bindVesselPopup._bound = true;

        map.on('click', 'vessel-point', (e) => {
            const f = e.features && e.features[0];
            if (!f) return;
            const [lon, lat] = f.geometry.coordinates;

            const targetISO = (typeof window.lastVesselTsISO === 'string' && window.lastVesselTsISO)
                ? window.lastVesselTsISO
                : new Date().toISOString();

            // Open‑Meteo (env-api.js에서 export한 ajaxEnvAt 사용)
            window.ajaxEnvAt(lat, lon, targetISO).then((env) => {
                const html = window.buildEnvPopupHTML(env);
                new mapboxgl.Popup({ offset: 10 })
                    .setLngLat([lon, lat])
                    .setHTML(html)
                    .addTo(map);
            }).fail(err => console.error('팝업 데이터 실패', err));
        });
    }

    // 메인: MMSI/IMO로 선박 조회 후 지도 반영
    async function loadVesselById(idType, idValue, map) {
        if (!idValue) throw new Error('ID 값 없음');
        const key = idType.toLowerCase(); // 'mmsi' or 'imo'
        const qs = new URLSearchParams({ [key]: idValue }).toString();

        const res = await fetch(`/api/predict?${qs}`, { cache: 'no-cache' });
        if (!res.ok) {
            let msg = `API 실패 (${res.status})`;
            try {
                const body = await res.json();
                if (body?.error) msg += `: ${body.error}`;
            } catch { }
            throw new Error(msg);
        }
        const data = await res.json();

        // 기준 시각 저장 (있으면)
        window.lastVesselTsISO = data?.latest?.ts ? new Date(data.latest.ts).toISOString() : null;

        // 1) 현재 포인트
        const cur = data.latest || {};
        if (typeof cur.lon !== 'number' || typeof cur.lat !== 'number') {
            throw new Error('latest.lon/lat 누락');
        }
        const curFeat = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [cur.lon, cur.lat] },
            properties: { cog: cur.cog ?? 0, heading: cur.heading ?? 0 }
        };
        ensureSource(map, 'vessel-current', toFC([curFeat]));

        // 2) 궤적
        const timelineCoords = (data.timeline || [])
            .filter(p => typeof p.lon === 'number' && typeof p.lat === 'number')
            .map(p => [p.lon, p.lat]);
        ensureSource(map, 'vessel-track', {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: timelineCoords.length ? timelineCoords : [[cur.lon, cur.lat]]
            },
            properties: {}
        });

        // 3) 예측 경로 Top-3
        (data.tracks_topk || []).slice(0, 3).forEach((tk, idx) => {
            const coords = (tk.track || [])
                .filter(p => typeof p.lon === 'number' && typeof p.lat === 'number')
                .map(p => [p.lon, p.lat]);
            const srcId = `pred-${idx + 1}`;
            ensureSource(map, srcId, {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: { port_id: tk.port_id, rank: tk.rank }
            });
        });

        // 4) 현재 위치 팝업(예측 요약)
        const predsHtml = (cur.predictions || [])
            .slice()
            .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
            .map(p => {
                const prob = (typeof p.prob === 'number') ? (p.prob * 100).toFixed(2) + '%' : '-';
                return `Top-${p.rank}: ${p.port_id} ${prob} • ETA ${p.eta ?? '-'}`;
            })
            .join('<br/>');

        new mapboxgl.Popup({ offset: 10, closeButton: false })
            .setLngLat([cur.lon, cur.lat])
            .setHTML(
                `<div style="font:12px/1.4 -apple-system,Segoe UI,Arial">
           <b>현재</b> ${Number(cur.lat).toFixed(4)}, ${Number(cur.lon).toFixed(4)}<br/>
           Cog ${Math.round(cur.cog || 0)}°, Hdg ${Math.round(cur.heading || 0)}°<br/>
           ${predsHtml}
         </div>`
            )
            .addTo(map);

        // 5) 카메라 이동 + 레이어 준비
        map.easeTo({ center: [cur.lon, cur.lat], zoom: 7 });
        ensureVesselLayers(map);
    }

    // 버튼 핸들러
    function attachSearchHandlers(map) {
        const selectors = [
            '.sidebar__btn.primary', // 너의 "조회" 버튼
            '#mmsiSearch', '#searchBtn', '#chatSend', '#predictSearch', '#imoSearch'
        ];
        $(function () {
            $(selectors.join(',')).on('click', () => {
                const idType = getSelectedIdType();  // 'MMSI' or 'IMO'
                const idVal = getVesselIdInput();    // 입력값
                if (!idVal) { alert(`${idType} 입력`); return; }

                loadVesselById(idType, idVal, map).catch(err => {
                    console.error(err);
                    alert(err.message || '선박 조회 실패');
                });
            });
        });

        // 외부에서 직접 호출(옵션)
        window.loadVesselById = (type, id) => loadVesselById(type, id, map);
    }

    // 초기화
    function initWhenMapReady() {
        const map = window.appMap;
        if (!map) {
            setTimeout(initWhenMapReady, 50);
            return;
        }
        if (map.loaded && map.loaded()) {
            ensureVesselLayers(map);
            bindVesselPopup(map);
            attachSearchHandlers(map);
        } else {
            map.on('load', () => {
                ensureVesselLayers(map);
                bindVesselPopup(map);
                attachSearchHandlers(map);
            });
        }
    }

    // kick off
    initWhenMapReady();
})();
