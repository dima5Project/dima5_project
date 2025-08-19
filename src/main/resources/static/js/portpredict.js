// 선박정보, 항구정보 전역변수 선언
let vesselData = [];
let portData = [];
// 전역 변수 초기화
let globalRoutesData = [];
let globalPredictions = [];

// 페이지 로드 시 CSV 데이터를 불러오는 함수
async function loadVesselData() {
    try {
        const response = await fetch('/data/vessel_master.csv');
        const csvText = await response.text();
        vesselData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
        console.log("Vessel data loaded successfully:", vesselData.length, "records.");
    } catch (error) {
        console.error("Failed to load vessel data:", error);
    }
}

// 항구 데이터 CSV를 불러오는 함수
async function loadPortData() {
    try {
        const response = await fetch('/data/port_name.csv');
        const csvText = await response.text();
        portData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
        console.log("Port data loaded successfully:", portData.length, "records.");
        publishSupportedPortIds();
    } catch (error) {
        console.error("Failed to load port data:", error);
    }
}

// --- 항구 ID로 항구 정보를 찾는 함수 ---
function getPortInfo(portId) {
    if (!portData || portData.length === 0) {
        console.warn("Port data is not loaded.");
        return { country_name_kr: '정보 없음', port_name_kr: '정보 없음' };
    }
    const foundPort = portData.find(port => port.port_id && port.port_id.toUpperCase() === portId.toUpperCase());
    if (foundPort) {
        return foundPort;
    } else {
        console.warn(`Port ID not found: ${portId}`);
        return { country_name_kr: '정보 없음', port_name_kr: '정보 없음' };
    }
}



// ───────── 선박 ID 타입 상태를 관리하는 전용 함수 ─────────

function updateIdType(type) {
    const $wrap = $('.cselect');

    // UI 업데이트
    $wrap.find('.cselect__value').text(type).attr('data-value', type);
    $wrap.find('.cselect__option').attr('aria-selected', 'false');
    $wrap.find(`.cselect__option[data-value="${type}"]`).attr('aria-selected', 'true');

    // 숨겨진 input 값 업데이트
    let $hidden = $wrap.find('input[type="hidden"][name="idType"]');
    if (!$hidden.length) {
        $hidden = $('<input>', { type: 'hidden', name: 'idType' });
        $wrap.append($hidden);
    }
    $hidden.val(type);

    // 드롭다운 닫기
    $wrap.removeClass('is-open').find('.cselect__control').attr('aria-expanded', 'false');
}


$(function () {

    // 페이지 로드 시 선박 데이터 로드 및 초기 ID 타입 설정

    loadVesselData();

    loadPortData();

    updateIdType('MMSI'); // 페이지 로드 시 MMSI로 초기 상태 설정



    // 사이드바 토글

    $(document).on('click', '.sidebar__handle', function () {

        const $sidebar = $('.sidebar');

        const isCollapsed = $sidebar.toggleClass('is-collapsed').hasClass('is-collapsed');

        $(this).attr('aria-expanded', !isCollapsed);

    });



    // 조회 버튼: 클릭 이벤트

    $(document).on('click', '.sidebar__btn.primary', async function () {

        const idType = $('input[name="idType"]').val(); // 숨겨진 input에서 정확한 값 가져오기

        const idValue = $('.sidebar__input').val().trim();



        if (!idValue) {

            alert('선박 고유 번호를 입력해주세요.');

            return;

        }



        // 선박 정보를 찾고 해당 vsl_id를 가져옴

        const vslIdToFetch = updateVesselInfo(idType, idValue);



        if (!vslIdToFetch) {

            // updateVesselInfo에서 이미 경고창을 띄웠으므로 여기서는 추가 작업 없이 종료

            return;

        }



        // API 호출 로직

        try {

            const response = await fetch(`http://127.0.0.1:8000/predict_map_by_vsl?vsl_id=${vslIdToFetch}`);



            // 응답 Content-Type 확인

            const contentType = response.headers.get("content-type");

            const isJson = contentType && contentType.includes("application/json");



            // HTTP 상태 코드에 따른 분기 처리

            if (!response.ok) {

                let errorData = null;

                if (isJson) {

                    errorData = await response.json();

                } else {

                    // JSON이 아닌 경우 (대부분 HTML 오류 페이지)

                    console.error("서버에서 JSON이 아닌 응답을 받았습니다. 상태 코드:", response.status);

                    alert(`데이터를 불러오는 중 오류가 발생했습니다. (상태 코드: ${response.status})`);

                    return;

                }



                // JSON 응답일 경우

                if (response.status === 404) {

                    alert(`오류: 일치하는 선박 정보가 없습니다. (vsl_id: ${vslIdToFetch})`);

                } else if (response.status === 409) {

                    alert(`알림: 선박이 이미 도착했습니다. (도착 항구: ${errorData.detail.port_id})`);

                } else {

                    alert(`데이터를 불러오는 중 오류가 발생했습니다. (오류 메시지: ${errorData.detail?.message || '알 수 없음'})`);

                }

                // 이 시점에서 throw new Error 대신 함수를 종료

                return;

            }



            // 응답이 성공적이고, Content-Type이 JSON인 경우에만 파싱

            if (!isJson) {

                console.error("성공적인 응답이지만 JSON 형식이 아닙니다.");

                alert("데이터 형식에 문제가 발생했습니다.");

                return;

            }

            const resp = await response.json();

            console.log("API로부터 받은 데이터:", resp); // 디버깅
            // ★ 저장용 전역 값 세팅 (이 3줄을 꼭 추가)
            window.currentLat = Number(resp?.latest?.lat ?? 0);
            window.currentLon = Number(resp?.latest?.lon ?? 0);
            window.globalPredictions = Array.isArray(resp?.latest?.predictions) ? resp.latest.predictions : [];



            // 3시간 미만일 경우 처리

            if (resp.note && resp.note.includes("<3h")) {

                alert('출항 후 3시간 미만인 선박은 항로 변화가 크지 않아 정확한 예측이 어렵습니다. 잠시 후 다시 조회 해 주세요.');

                // 현재 위치를 지도에 표시하는 로직만 실행하고, 예측 결과는 숨깁니다.

                $('.box').removeClass('is-active');

                $('.sidebar__content').addClass('is-hidden');

                // ... 현재 위치 마커만 그리는 로직 추가

                return;

            }



            const departurePort = { "id": "KRBUS", "country": "한국", "city": "부산", "lat": 35.0999, "lon": 129.111 };



            // 화면 UI 업데이트 (슬라이드에 데이터 반영)

            displayPredictionResults(resp.latest.predictions, departurePort);

            displayTimelineResults(resp.timeline, resp.latest);



            // 나머지 기존 조회 로직은 여기에 그대로 두시면 됩니다.

            if (resp.latest && resp.latest.predictions) {

                const predictions = resp.latest.predictions;

                const rank1Eta = predictions.find(p => p.rank === 1)?.eta || '정보 없음';

                const rank2Eta = predictions.find(p => p.rank === 2)?.eta || '정보 없음';

                const rank3Eta = predictions.find(p => p.rank === 3)?.eta || '정보 없음';



                $('.box.one .eta__time').html('<span class="pill">ETA</span> ' + rank1Eta);

                $('.box.two .eta__time').html('<span class="pill">ETA</span> ' + rank2Eta);

                $('.box.three .eta__time').html('<span class="pill">ETA</span> ' + rank3Eta);

            }



            // 맵 데이터 관련 기존 로직 유지

            const routesData = resp.tracks_topk.filter(trackObj => trackObj.rank >= 1 && trackObj.rank <= 3);



            const routes = [];

            let top1RouteData = null;



            routesData.forEach(topRouteData => {

                const trackPoints = topRouteData.track || [];

                if (trackPoints.length > 0) {

                    const coordinates = trackPoints.map(point => [point.lon, point.lat]);

                    if (departurePort) {

                        coordinates.unshift([departurePort.lon, departurePort.lat]);

                    }

                    let color = '#007cbf';

                    if (topRouteData.rank === 2) {

                        color = '#A9A9A9';

                    } else if (topRouteData.rank === 3) {

                        color = '#A9A9A9';

                    }

                    const name = `예상 항로 (Top ${topRouteData.rank})`;

                    routes.push({

                        route_name: name,

                        coordinates: coordinates,

                        color: color,

                        rank: topRouteData.rank

                    });



                    if (topRouteData.rank === 1) {

                        top1RouteData = topRouteData;

                    }

                }

            });



            globalRoutesData = routes;

            globalPredictions = resp.latest.predictions;



            $('.box').addClass('is-active');



            const validMarkers = [];



            if (top1RouteData && top1RouteData.track && top1RouteData.track.length > 0) {

                const firstPoint = top1RouteData.track[0];

                validMarkers.push({

                    coordinates: [firstPoint.lon, firstPoint.lat],

                    description: `예상 항로 시작점 (Time 0)`

                });

            }



            if (resp.timeline && resp.timeline.length > 0) {

                resp.timeline.forEach(timeData => {

                    if (timeData.lat && timeData.lon) {

                        validMarkers.push({

                            coordinates: [timeData.lon, timeData.lat],

                            description: `예측 시점: ${timeData.time_point}h`

                        });

                    }

                });

            }



            if (resp.latest && resp.latest.lat && resp.latest.lon) {

                lastMarker = {

                    coordinates: [resp.latest.lon, resp.latest.lat],

                    description: `현재 시점 (출항 후 ${resp.latest.time_point}시간)`

                };

            }



            if (typeof window.drawRoutes === 'function' && typeof window.drawMarkers === 'function') {

                window.drawRoutes(routes);

                window.drawMarkers(validMarkers, lastMarker);

                window.togglePortMarkersByRank([1, 2, 3]);

                window.toggleMarkersVisibility(true);

            } else {

                console.error("Map functions are not available.");

            }



            $('.sidebar__content').removeClass('is-hidden');

            $('.sidebar__input').blur().prop('disabled', true).attr('aria-disabled', 'true').addClass('is-locked');

            $('.cselect__control').prop('disabled', true);



        } catch (error) {

            console.error('API 호출 중 오류 발생:', error);

            // 오류 경고창은 이미 위에서 처리했으므로 여기서는 추가로 띄우지 않아도 됩니다.

            alert('네트워크 또는 서버 문제로 데이터를 불러올 수 없습니다. 서버 로그를 확인해주세요.');

        }

    });





    // 예측 결과 박스 클릭 이벤트 (개별 토글 로직)

    $(document).on('click', '.box.one, .box.two, .box.three', function () {

        if (!globalRoutesData || globalRoutesData.length === 0) {

            console.warn('globalRoutesData is empty. Cannot draw routes.');

            return;

        }



        const $box = $(this);

        $box.toggleClass('is-active');



        const activeRanks = [];

        $('.box.is-active').each(function () {

            const rank = $(this).hasClass('one') ? 1 : ($(this).hasClass('two') ? 2 : 3);

            activeRanks.push(rank);

        });



        const routesToDraw = globalRoutesData.filter(route => activeRanks.includes(route.rank));

        window.drawRoutes(routesToDraw);



        if (typeof window.togglePortMarkersByRank === 'function') {

            window.togglePortMarkersByRank(activeRanks);

        }



        const isRank1Active = $('.box.one').hasClass('is-active');

        if (typeof window.toggleMarkersVisibility === 'function') {

            window.toggleMarkersVisibility(isRank1Active);

        }

    });



    function toggleMarkersForRank1(isVisible) {

        if (typeof window.toggleMarkersVisibility === 'function') {

            window.toggleMarkersVisibility(isVisible);

        } else {

            console.warn("toggleMarkersVisibility 함수가 map.js에 존재하지 않습니다.");

        }

    }



    // 초기화 버튼: 클릭 이벤트

    $(document).on('click', '.sidebar__row .sidebar__btn:not(.primary)', function () {

        $('.sidebar__input').val('');

        $('.sidebar__vesselinfo .kv strong').text('정보 없음');

        updateIdType('MMSI');

        $('#predict-content').addClass('is-hidden');

        $('.box').removeClass('is-active');

        globalRoutesData = [];

        globalPredictions = [];

        window.clearRoutesAndMarkers();

        window.showAllPortMarkers();

        clearTimeline();

        $('.sidebar__input').prop('disabled', false).removeAttr('aria-disabled').removeClass('is-locked');

        $('.cselect__control').prop('disabled', false);

    });



    function clearTimeline() {

        $('.voy-timeline').empty();

    }



    // ───────── JSON 데이터를 화면에 표시 ─────────

    function displayPredictionResults(predictions, departurePort) {

        if (!predictions || predictions.length === 0) {

            console.warn('예측 데이터가 없습니다.');

            return;

        }



        predictions.forEach(prediction => {

            let boxSelector;

            if (prediction.rank === 1) {

                boxSelector = '.box.one';

            } else if (prediction.rank === 2) {

                boxSelector = '.box.two';

            } else if (prediction.rank === 3) {

                boxSelector = '.box.three';

            }



            if (boxSelector) {

                const $box = $(boxSelector);

                // 항구 정보 가져오기

                const portInfo = getPortInfo(prediction.port_id);



                // 디버깅 코드 추가

                console.log(`Debug Info:`);

                console.log(`Port ID: ${prediction.port_id}`);

                console.log(`portInfo 객체:`, portInfo);



                // Top 박스 UI 업데이트

                if (prediction.rank === 1) {

                    $box.find('.head__label.num').text(`${prediction.rank}`);

                } else {

                    const $label = $box.find('.head__label');

                    $label.text(`Top - ${prediction.rank}`);

                }

                $box.find('.box__head strong').text(`${(prediction.prob * 100).toFixed(2)}%`);

                $box.find('.last').text(prediction.port_id);

                // 'sub dest' 클래스에 국가명 / 항구명 업데이트

                $box.find('.sub.dest').text(`${portInfo.country_name_kr} / ${portInfo.port_name_kr}`);

            }

        });

    }



    // 간단 토글 + 선택 저장

    $(document).on('click', '.cselect__control', function () {

        const $wrap = $(this).closest('.cselect');

        const open = $wrap.toggleClass('is-open').hasClass('is-open');

        $(this).attr('aria-expanded', open);

    });



    // 옵션 클릭

    $(document).on('click', '.cselect__option', function () {

        const value = $(this).data('value');

        updateIdType(value);

    });



    // 바깥 클릭 시 닫기

    $(document).on('click', function (e) {

        if ($(e.target).closest('.cselect').length === 0) {

            $('.cselect.is-open').removeClass('is-open').find('.cselect__control').attr('aria-expanded', 'false');

        }

    });



    // 아이콘

    $(function () {

        $('.sidebar__topbox .iconwrap[data-panel="predict"]').addClass('is-active');

        $('.panel--predict').addClass('is-active');

    });



    // 상단 아이콘(버튼) 클릭 → 패널 전환 + 활성 표시

    $(document).on('click', '.sidebar__topbox .iconwrap', function () {

        const target = $(this).data('panel');

        $('.sidebar__topbox .iconwrap').removeClass('is-active');

        $(this).addClass('is-active');

        $('.panel').removeClass('is-active').attr('hidden', true);

        $(`.panel--${target}`).addClass('is-active').removeAttr('hidden');

        window.dispatchEvent(new Event('resize'));

    });



    document.addEventListener('click', (e) => {

        const btn = e.target.closest('.map-icon-ctrl .iconbtn');

        if (!btn) return;

        const type = btn.dataset.type;

        const on = !btn.classList.contains('is-on');

        btn.classList.toggle('is-on', on);

        document.dispatchEvent(new CustomEvent('panel:toggle', {

            detail: { type, on }

        }));

    });



    // ───────── JSON 데이터를 화면에 표시 ─────────

    function displayTimelineResults(timeline, latest) {

        $('.voy-timeline').empty();

        if (!timeline || timeline.length === 0) {

            return;

        }



        const $startItem = $('<li class="voy-item"></li>');

        const $startNode = $(`<button class="voy-node" type="button" aria-pressed="false">

                            <img src="/images/portpredictImages/vessel_Icon.png" th:src="@{/images/portpredictImages/vessel_Icon.png}"

                                   alt="출발항 아이콘" />

                        </button>`);

        const $startRows = $('<div class="voy-rows"></div>');

        $startRows.append(`<div class="voy-label">KRBUS</div>`);

        const $startRow = $(`<div class="voy-row">

                            <div class="depart_pillbtn">ATD</div>

                            <div class="voy-chip">${latest.departure_time}</div>

                        </div>`);

        $startRows.append($startRow);

        $startItem.append($startNode);

        $startItem.append($startRows);

        $('.voy-timeline').append($startItem);



        timeline.forEach(timeData => {

            const timePoint = timeData.time_point;

            const timeStamp = timeData.time_stamp;

            const predictions = timeData.predictions;

            const $timelineItem = $('<li class="voy-item"></li>');

            const $voyNode = $(`<button class="voy-node" type="button" aria-pressed="false">

                                <img src="/images/portpredictImages/marker.png" th:src="@{/images/portpredictImages/marker.png}"

                                       alt="마커 아이콘" />

                                 </button>`);

            $timelineItem.append($voyNode);

            const $voyRows = $('<div class="voy-rows"></div>');

            $voyRows.append(`<div class="voy-label">출항 후 ${timePoint}시간</div>`);



            if (predictions && predictions.length > 0) {

                predictions.forEach(prediction => {

                    const $predictionRow = $(`

                <div class="voy-row">

                    <button class="pillbtn" type="button">Top-${prediction.rank}</button>

                    <div class="voy-chip">${prediction.port_id} · ${(prediction.prob * 100).toFixed(2)}%</div>

                </div>

                `);

                    $voyRows.append($predictionRow);

                });

            }

            $timelineItem.append($voyRows);

            $('.voy-timeline').append($timelineItem);

        });



        if (latest && latest.time_point !== undefined && latest.predictions) {

            const $latestItem = $('<li class="voy-item"></li>');

            const $latestNode = $(`<button class="voy-node" type="button" aria-pressed="false">

                                    <img src="/images/portpredictImages/marker.png" th:src="@{/images/portpredictImages/marker.png}"

                                           alt="마커 아이콘" />

                                   </button>`);

            $latestItem.append($latestNode);

            const $latestRows = $('<div class="voy-rows"></div>');

            $latestRows.append(`<div class="voy-label">현재 시점 (출항 후 ${latest.time_point}시간)</div>`);



            if (latest.predictions.length > 0) {

                latest.predictions.forEach(prediction => {

                    const $predictionRow = $(`

                <div class="voy-row">

                    <button class="pillbtn" type="button">Top-${prediction.rank}</button>

                    <div class="voy-chip">${prediction.port_id} · ${(prediction.prob * 100).toFixed(2)}%</div>

                </div>

                `);

                    $latestRows.append($predictionRow);

                });

            }

            $latestRows.append(`<div class="voy-row"></div>`);

            $latestItem.append($latestRows);

            $('.voy-timeline').append($latestItem);

        }

    }



    // 2) 슬라이드 원형 : 회색 <-> 파랑 + 팝 애니메이션

    $(document).on('click', '.voy-node', function () {

        const $node = $(this);

        $node.toggleClass('is-active');

        $node.addClass('is-pop');

        const prev = $node.data('popTimer');

        if (prev) clearTimeout(prev);

        const timer = setTimeout(() => {

            $node.removeClass('is-pop');

        }, 180);

        $node.data('popTimer', timer);

    });


    // ====== 저장 모달 관련 새로운 로직 시작 ======
    function hasPredictResult() {
        // globalPredictions 변수가 비어있지 않은지 확인
        return globalPredictions && globalPredictions.length > 0;
    }

    function openSaveModal() {
        // 모달 초기 상태로 리셋
        const saveModal = document.getElementById('saveModal');
        const modalTitle = saveModal.querySelector('.modal__title');
        const modalActions = saveModal.querySelector('.modal__actions');

        // 이전 포커스 기억
        saveModal._prevFocus = document.activeElement;

        modalTitle.textContent = '결과를 저장할까요?';
        modalActions.innerHTML = `
            <button class="modal__btn primary" data-action="yes">예</button>
            <button class="modal__btn secondary" data-action="no">아니오</button>
        `;

        // 새로 생성된 버튼에 이벤트 리스너 다시 연결
        modalActions.querySelector('[data-action="yes"]').addEventListener('click', handleSaveYesClick);
        modalActions.querySelector('[data-action="no"]').addEventListener('click', closeSaveModal);

        saveModal.classList.add('is-open');
        saveModal.setAttribute('aria-hidden', 'false');
        saveModal.setAttribute('role', 'dialog');
        saveModal.setAttribute('aria-modal', 'true');

        // 배경 비활성 (지원 브라우저에서만)
        try { APP_ROOT.setAttribute('inert', ''); } catch (e) { }

        // 포커스 이동
        const firstBtn = modalActions.querySelector('button');
        if (firstBtn) firstBtn.focus();

    }


    function closeSaveModal() {
        const saveModal = document.getElementById('saveModal');

        // 1) 모달 내부 포커스가 남아 있으면 빼기
        const active = document.activeElement;
        if (saveModal.contains(active)) active.blur();

        // 2) 이전 포커스로 돌리기(가능하면)
        const prev = saveModal._prevFocus;
        if (prev && typeof prev.focus === 'function') {
            // 모달 숨기기 전에 혹은 직후에 살짝 지연하여 포커스 복원
            setTimeout(() => prev.focus(), 0);

            // 3) 모달 숨김
            saveModal.classList.remove('is-open');
            saveModal.setAttribute('aria-hidden', 'true');

            // 4) 배경 inert 해제
            APP_ROOT.removeAttribute('inert');

        }
    }


    // '예' 버튼 클릭 시 호출될 비동기 함수
    async function handleSaveYesClick() {
        const saveModal = document.getElementById('saveModal');
        const modalTitle = saveModal.querySelector('.modal__title');
        const modalActions = saveModal.querySelector('.modal__actions');

        // 로딩 상태
        modalTitle.textContent = '저장 중...';
        modalActions.innerHTML = '<p>잠시만 기다려주세요.</p>';

        // 1) 입력값/Top1 추출
        const typedId = document.querySelector('.sidebar__input')?.value?.trim() || '';
        const preds = Array.isArray(window.globalPredictions) ? window.globalPredictions : [];
        const top1 = preds.find(p => p.rank === 1)
            || preds.sort((a, b) => (b?.prob || 0) - (a?.prob || 0))[0]
            || null;

        // 2) 좌표 (조회 성공 직후 resp.latest.lat/lon을 전역 저장해두세요)
        const lat = (typeof window.currentLat === 'number') ? window.currentLat : 0;
        const lon = (typeof window.currentLon === 'number') ? window.currentLon : 0;

        // 3) ETA 원본/ISO
        const rawEta = top1?.eta ?? null; // 서버에서 종종 '정보 없음'이 올 수도 있으니 원본으로 판단
        const etaISO = rawEta ? rawEta.replace(' ', 'T') : null; // → "2025-08-21T14:30:32"


        // 4) 저장할 값이 없으면 안내만 (API 호출 X)
        if (!typedId || !top1 || !top1.port_id || typeof top1.prob !== 'number' || !etaISO) {
            modalTitle.textContent = '저장할 결과가 없습니다';
            modalActions.innerHTML = `
            <p>
                선박: ${typedId || '없음'}<br>
                항구: ${top1?.port_id || '없음'} / 확률: ${typeof top1?.prob === 'number' ? top1.prob : '없음'}<br>
                ETA: ${rawEta || '없음'}
            </p>
            <button class="modal__btn primary" data-action="close">확인</button>`;
            modalActions.querySelector('[data-action="close"]').addEventListener('click', closeSaveModal);
            return; // ★ API 호출 안 함
        }

        // 4) 서버 DTO (백엔드 ResultSaveDTO와 1:1)
        const dtoPayload = {
            searchVsl: typedId,     // 사용자가 입력한 IMO/MMSI
            lat: Number(lat),
            lon: Number(lon),
            top1Port: top1.port_id || '없음',
            top1Pred: typeof top1?.prob === 'number' ? top1.prob : 0.0,
            eta: etaISO             // "YYYY-MM-DDTHH:mm:ss"
        };

        console.log('[SAVE] payload =', dtoPayload);

        try {
            const response = await fetch('/api/result-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dtoPayload)
            });

            if (response.ok) {
                // 응답 바디가 없을 수도 있으니 방어
                await response.json().catch(() => ({}));
                modalTitle.textContent = '저장되었습니다.';
                modalActions.innerHTML = `
                    <p>마이페이지 &gt; 내 선박 정보에서 확인해주세요.</p>
                    <button class="modal__btn primary" data-action="close">확인</button>`;
                modalActions.querySelector('[data-action="close"]').addEventListener('click', closeSaveModal);
            } else {
                let msg = '알 수 없는 오류';
                try { const e = await response.json(); msg = e?.message || msg; } catch { }
                modalTitle.textContent = '저장 실패';
                modalActions.innerHTML = `
                    <p>오류가 발생했습니다: ${msg}</p>
                    <button class="modal__btn primary" data-action="close">닫기</button>`;
                modalActions.querySelector('[data-action="close"]').addEventListener('click', closeSaveModal);
            }
        } catch (error) {
            console.error('API 호출 오류:', error);
            modalTitle.textContent = '저장 실패';
            modalActions.innerHTML = `
                <p>네트워크 오류가 발생했습니다. 다시 시도해주세요.</p>
                <button class="modal__btn primary" data-action="close">닫기</button>`;
            modalActions.querySelector('[data-action="close"]').addEventListener('click', closeSaveModal);
        }
    }


    // '저장' 버튼 클릭 이벤트
    $(document).on('click', '.sidebar__btn.save', function () {
        if (!hasPredictResult()) {
            alert('먼저 [조회]를 실행해 결과를 확인한 뒤 저장버튼을 클릭해주세요.');
            return;
        }
        openSaveModal();
    });

    // '아니오' 버튼과 배경 클릭 이벤트
    $(document).on('click', '#saveModal [data-action="no"]', function () {
        closeSaveModal();
    });

    $(document).on('click', '#saveModal .modal__bg', function () {
        closeSaveModal();
    });

    // Escape 키로 모달 닫기
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#saveModal').hasClass('is-open')) {
            closeSaveModal();
        }
    });

    // '확인' 버튼 클릭 이벤트 (성공/실패 모달)
    $(document).on('click', '#saveModal [data-action="close"]', function () {
        closeSaveModal();
    });

    // // '예' 버튼에 새로운 로직 연결 (기존 코드는 삭제)
    // $(document).off('click', '#saveModal [data-action="yes"]')
    //             .on('click', '#saveModal [data-action="yes"]', handleSaveYesClick);

});



// 선박 정보를 찾아 HTML에 업데이트하는 함수

function updateVesselInfo(type, value) {

    let dataKey;

    if (type && type.toLowerCase() === 'mmsi') {

        dataKey = 'vsl_mmsi';

    } else if (type && type.toLowerCase() === 'imo') {

        dataKey = 'vsl_imo';

    } else {

        console.error("Invalid vessel ID type:", type);

        alert('유효하지 않은 선박 ID 유형입니다.');

        return null;

    }

    const foundVessel = vesselData.find(vessel => {

        const csvValue = String(vessel[dataKey] || '').trim().replace(/[^0-9]/g, '');

        const inputValue = value.trim().replace(/[^0-9]/g, '');

        console.log(`--- Debugging Search ---`);

        console.log(`Search Type: ${type}`);

        console.log(`Column Key: ${dataKey}`);

        console.log(`CSV Value (Cleaned): '${csvValue}'`);

        console.log(`Input Value (Cleaned): '${inputValue}'`);

        console.log(`Match Result: ${csvValue === inputValue}`);

        console.log(`------------------------`);

        return csvValue === inputValue;

    });



    if (foundVessel) {

        $('.sidebar__vesselinfo .kv strong:eq(0)').text(foundVessel.call_sign || '정보 없음');

        $('.sidebar__vesselinfo .kv strong:eq(1)').text(foundVessel.ship_type || '정보 없음');

        $('.sidebar__vesselinfo .kv strong:eq(2)').text(foundVessel.vsl_length ? foundVessel.vsl_length + ' m' : '정보 없음');

        $('.sidebar__vesselinfo .kv strong:eq(3)').text(foundVessel.vsl_width ? foundVessel.vsl_width + ' m' : '정보 없음');

        $('#predict-content').removeClass('is-hidden');

        return foundVessel.vsl_id; // 찾은 선박의 vsl_id 반환

    } else {

        alert('일치하는 선박 정보가 없습니다.');

        $('#predict-content').addClass('is-hidden');

        return null; // 선박이 없는 경우 null 반환

    }

}