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
    map.addControl(nav, 'bottom-right');

    // ★ 좌하단에 저작권 아이콘(컴팩트)으로 다시 추가 (추가)
    map.addControl(new mapboxgl.AttributionControl({
        compact: true
    }), 'bottom-left');

    // 마커 테스트
    new mapboxgl.Marker()
        .setLngLat([129.05, 35.13])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>부산항</h3>"))
        .addTo(map);
});

