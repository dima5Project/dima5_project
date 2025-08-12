document.addEventListener("DOMContentLoaded", () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxMTA1IiwiYSI6ImNtZGw4MGx6djEzMzcybHByM3V4OHg3ZmEifQ.X56trJZj050V3ln_ijcwcQ';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [129.05, 35.13], // 부산항 좌표 (예시)
        zoom: 4,
        scrollZoom: true,   // 마우스 휠 줌 유지
        attributionControl: false
    });

    // 우하단 + / − 줌 버튼 추가 (나침반 숨김)
    const nav = new mapboxgl.NavigationControl({
        showZoom: true,
        showCompass: false
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    new mapboxgl.Marker()
        .setLngLat([129.05, 35.13])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>부산항</h3>"))
        .addTo(map);

    map.on('load', () => {
        map.addSource('ports', { type: 'geojson', data: '/data/ports.geojson' });

        map.addLayer({
            id: 'port-points',
            type: 'symbol',
            source: 'ports',
            layout: { 'icon-image': 'harbor-15', 'icon-size': 1.0, 'icon-allow-overlap': true }
        });

        map.on('click', 'port-points', (e) => {
            const f = e.features[0];
            const [lon, lat] = f.geometry.coordinates;
            const { port_id, loc_lat, loc_lon } = f.properties;
            new mapboxgl.Popup()
                .setLngLat([lon, lat])
                .setHTML(`<div style="font-weight:700">${port_id}</div>
                  <div style="font-size:12px;color:#666">(${loc_lat}, ${loc_lon})</div>`)
                .addTo(map);
        });

        map.on('mouseenter', 'port-points', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'port-points', () => map.getCanvas().style.cursor = '');
    });
});


