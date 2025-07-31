document.addEventListener("DOMContentLoaded", () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoieW9oaSIsImEiOiJjbWRrYm1lcG4weWU5Mm1vbmJlY3MzeTBoIn0.Zf8ePNNwYUwVe7sITbx9Ew';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [126.9780, 37.5665], // 서울 좌표 (예시)
        zoom: 4
    });

    // 마커 테스트
    new mapboxgl.Marker()
        .setLngLat([126.9780, 37.5665])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>서울시청</h3>"))
        .addTo(map);
});

/*
자바스크립트 변수 선언 키워드
var: 값 변경 가능. 재선언 가능. 함수 스코프
let: 값 변경 가능. 재선언 불가능. 블록 스코프
const: 상수 선언. 값 변경 불가능. 재선언 불가능. 블록 스코프
       선언할 때 초기값을 무조건 넣어야 함.
       변수 자체는 재할당할 수 없는데, 객체나 배열의 내부 값은 바뀔 수 있음.
       ex. const person = {name: "박"}; person.name = '김'; <- 이런 것은 가능

const map = new mapboxgl.Map({...}); 이렇게 사용하는 이유
-> map이라는 객체를 새로 바꿀 일이 없고, 그 안에서 .addTo()나 .setStyle() 같은 메서드만 쓸 거니까 const로 선언함
*/