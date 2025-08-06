// ✅ info.js 전체 코드

let allPortData = [];
let portNameList = [];

let currentWeatherPage = 0;
let currentExchangePage = 0;
let currentDockingPage = 0;

// 초기 실행４
$(function () {
    // --선텏상자 둘에 이벤트
    $.ajax({

    });

});
window.addEventListener("DOMContentLoaded", () => {
    // 선택상자 두놈한테 이벤트 ｃｈａｎｇｅ 에０빈
    fetch("/api/info/all")
        .then(res => res.json())
        .then(data => {
            allPortData = data;
            renderWeatherCard();
            renderExchangeCard();
            renderDockingCard();
        });

    fetch("/api/info/port-names")
        .then(res => res.json())
        .then(data => {
            portNameList = data;
            loadCountries();
        });
});

// 국가 옵션 구성
function loadCountries() {
    const countrySelect = document.getElementById("countrySelect");
    const countrySet = [...new Set(portNameList.map(p => p.countryNameKr))];

    countrySet.forEach(country => {
        const opt = document.createElement("option");
        opt.value = country;
        opt.textContent = country;
        countrySelect.appendChild(opt);
    });
}

// 국가 선택 시 항구 목록 구성
function updatePortsByCountry(country) {
    const portSelect = document.getElementById("portSelect");
    portSelect.innerHTML = '<option value="">항구 선택</option>';

    const filtered = portNameList.filter(p => p.countryNameKr === country);
    filtered.forEach(port => {
        const opt = document.createElement("option");
        opt.value = port.portId;
        opt.textContent = port.portNameKr;
        portSelect.appendChild(opt);
    });
    console.log(filtered)
}

// 검색 시 해당 항구 정보만 카드로 출력
function searchPortInfo() {
    const portId = document.getElementById("portSelect").value;
    if (!portId) return;

    const filtered = allPortData.filter(p => p.portNameInfo.portId === portId);
    if (!filtered.length) return;

    renderWeatherCard(filtered);
    renderExchangeCard(filtered);
    renderDockingCard(filtered);
}

// 카드 출력 공통 함수들
function renderWeatherCard(data = allPortData) {
    const card = document.getElementById("weatherCard");
    card.innerHTML = `<h3>🌤️ 날씨 정보</h3><div class="card-grid" id="weatherGrid"></div>`;

    const start = currentWeatherPage * 4;
    const slice = data.slice(start, start + 4);

    const grid = document.getElementById("weatherGrid");
    slice.forEach(port => {
        const item = document.createElement("div");
        item.className = "card-item";
        item.innerHTML = `
            <strong>항구명:</strong> ${port.portNameInfo.portNameKr}<br>
            <img src="https://openweathermap.org/img/wn/${port.weather.icon}.png" /><br>
            기온: ${port.weather.temperature}<br>
            강수량: ${port.weather.rain || "0 mm"}
        `;
        grid.appendChild(item);
    });

    card.innerHTML += `
        <div class="nav-buttons">
            <button onclick="changeWeatherPage(-1)">←</button>
            <button onclick="changeWeatherPage(1)">→</button>
        </div>
    `;
}

function changeWeatherPage(dir) {
    const max = Math.ceil(allPortData.length / 4) - 1;
    currentWeatherPage = Math.min(Math.max(currentWeatherPage + dir, 0), max);
    renderWeatherCard();
}

function renderExchangeCard(data = allPortData) {
    const card = document.getElementById("exchangeCard");
    card.innerHTML = `<h3>💱 환율 정보</h3><div class="card-grid" id="exchangeGrid"></div>`;

    const start = currentExchangePage * 4;
    const slice = data.slice(start, start + 4);

    const grid = document.getElementById("exchangeGrid");
    slice.forEach(port => {
        const code = getCurrencyCodeByCountry(port.portNameInfo.countryNameKr);
        const ex = port.exchanges.find(e => e.currency === code);
        const item = document.createElement("div");
        item.className = "card-item";
        item.innerHTML = ex ? `
            <strong>국가:</strong> ${port.portNameInfo.countryNameKr}<br>
            <strong>통화:</strong> ${ex.currency}<br>
            환율: ${ex.baseRate}<br>
            전일 대비: ${ex.exchangeRateChange || "정보 없음"}<br>
            기준 시각: ${ex.currentTime}
        ` : `
            <strong>${port.portNameInfo.countryNameKr}</strong><br>
            환율 정보 없음
        `;
        grid.appendChild(item);
    });

    card.innerHTML += `
        <div class="nav-buttons">
            <button onclick="changeExchangePage(-1)">←</button>
            <button onclick="changeExchangePage(1)">→</button>
        </div>
    `;
}

function changeExchangePage(dir) {
    const max = Math.ceil(allPortData.length / 4) - 1;
    currentExchangePage = Math.min(Math.max(currentExchangePage + dir, 0), max);
    renderExchangeCard();
}

function renderDockingCard(data = allPortData) {
    const card = document.getElementById("dockingCard");
    card.innerHTML = `<h3>⚓ 항구 접안 정보</h3><div class="card-grid" id="dockingGrid"></div>`;

    const start = currentDockingPage * 4;
    const slice = data.slice(start, start + 4);

    const grid = document.getElementById("dockingGrid");
    slice.forEach(port => {
        const item = document.createElement("div");
        item.className = "card-item";
        item.innerHTML = `
            <strong>항구명:</strong> ${port.portNameInfo.portNameKr}<br>
            국가: ${port.portNameInfo.countryNameKr}<br>
            접안 선박 수: ${port.shipsInPort}척<br>
            입항 예정 수: ${port.expectedShips}척
        `;
        grid.appendChild(item);
    });

    card.innerHTML += `
        <div class="nav-buttons">
            <button onclick="changeDockingPage(-1)">←</button>
            <button onclick="changeDockingPage(1)">→</button>
        </div>
    `;
}

function changeDockingPage(dir) {
    const max = Math.ceil(allPortData.length / 4) - 1;
    currentDockingPage = Math.min(Math.max(currentDockingPage + dir, 0), max);
    renderDockingCard();
}

function getCurrencyCodeByCountry(countryKr) {
    switch (countryKr) {
        case "대한민국": return "KRdhzpdlW";
        case "중국": return "CNY";
        case "일본": return "JPY";
        case "홍콩": return "HKD";
        case "필리핀": return "PHP";
        case "러시아": return "RUB";
        case "대만": return "TWD";
        case "베트남": return "VND";
        default: return "USD";
    }
}