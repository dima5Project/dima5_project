const slider = document.getElementById('port-slider');

fetch('/api/info/all')
    .then(res => res.json())
    .then(data => {
        data.forEach(port => {
            const card = document.createElement('div');
            card.classList.add('port-card');

            const iconUrl = `https://openweathermap.org/img/wn/${port.weather.icon}@2x.png`;

            card.innerHTML = `
        <h3>${port.portNameInfo.portNameKr} (${port.portNameInfo.portId})</h3>
        <p><strong>국가:</strong> ${port.portNameInfo.countryNameKr}</p>

        <hr>
        <p><strong>현재 온도:</strong> ${port.weather.temperature}</p>
        <img src="${iconUrl}" alt="날씨" style="width:60px; height:60px;">

        <hr>
        <p><strong>정박 선박 수:</strong> ${port.shipsInPort}</p>
        <p><strong>입항 예정:</strong> ${port.expectedShips}</p>

        <hr>
        <h4>환율 정보</h4>
        ${port.exchanges.map(ex => `
            <div class="exchange-box">
                <p><strong>${ex.currencyName} (${ex.currency})</strong></p>
                <p>기준가: ${ex.baseRate}</p>
                <p>전일대비: ${ex.exchangeRateChange}</p>
                <p>살 때: ${ex.buyRate}</p>
                <p>팔 때: ${ex.sellRate}</p>
            </div>
        `).join('')}
        
        <hr>
        <p><strong>위도:</strong> ${port.locLat}</p>
        <p><strong>경도:</strong> ${port.locLon}</p>
    `;

            slider.appendChild(card);
        });
    })
    .catch(error => {
        console.error("항구 정보 로드 실패:", error);
    });
