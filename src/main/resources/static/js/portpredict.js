// 선박정보, 항구정보 전역변수 선언
let vesselData = [];
let portData = [];

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

        // 기존 경고 메시지 및 도착 메시지 삭제
        $('.sidebar__divider').next('.sidebar__arrived-message').remove();

        // 선박 정보 조회 및 업데이트
        updateVesselInfo(idType, idValue);

        // --- 실제 백엔드 API 호출 로직 ---
        const BASE_URL = 'http://127.0.0.1:8000/api'; // 수정: API 경로에 /api 추가
        let resp;

        try {
            const url = new URL(`${BASE_URL}/predict`);
            if (idType.toLowerCase() === 'imo') {
                url.searchParams.append('imo', idValue);
            } else { // 기본 MMSI
                url.searchParams.append('mmsi', idValue);
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            resp = await response.json();
            console.log("API 응답:", resp);

        } catch (error) {
            console.error("API 호출 실패:", error);
            alert('서버 오류 또는 선박 정보를 찾을 수 없습니다. 다시 시도해 주세요.');
            // 오류 발생 시 UI 초기화
            $('.sidebar__input').val('');
            $('.sidebar__vesselinfo .kv strong').text('정보 없음');
            updateIdType('MMSI');
            $('#predict-content').addClass('is-hidden');
            $('.box').removeClass('is-active').show();
            globalRoutesData = [];
            globalPredictions = [];
            window.clearRoutesAndMarkers();
            window.showAllPortMarkers();
            clearTimeline();
            $('.sidebar__input').prop('disabled', false).removeAttr('aria-disabled').removeClass('is-locked');
            $('.cselect__control').prop('disabled', false);
            return;
        }

        // --- 추가된 도착 선박 로직 시작 ---
        if (resp.detail && resp.detail.code === 'arrived_ship') {
            const portInfo = getPortInfo(resp.detail.port_id);
            const portNameKr = portInfo.port_name_kr || resp.detail.port_id;

            // 1. 도착 메시지 표시
            const arrivedMessage = `<p class="sidebar__arrived-message" style="color: #28a745; font-weight: bold; margin-top: 10px;">해당 선박은 ${portNameKr}에 이미 도착했습니다.</p>`;
            $('.sidebar__divider').after(arrivedMessage);

            // 2. 예측 정보 박스 숨기기
            $('.sidebar__content').removeClass('is-hidden');
            $('.box').removeClass('is-active').hide();

            // 3. 지도에 과거 운항 경로 표시
            const pastRoute = {
                route_name: '과거 운항 경로',
                coordinates: resp.detail.track.map(point => [point.lon, point.lat]),
                color: '#555555', // 회색
                rank: 0 // 특별한 랭크
            };
            window.drawRoutes([pastRoute]);

            // 4. 도착 항구 마커만 남기기
            if (typeof window.showOnlyPortMarker === 'function') {
                window.showOnlyPortMarker(resp.detail.port_id);
            } else {
                // showOnlyPortMarker 함수가 없으면 모든 마커를 숨기고 도착 항구 마커만 표시
                window.hideAllPortMarkers();
                window.showPortMarker(resp.detail.port_id);
            }

            // 5. 기타 UI 초기화 및 비활성화
            $('.sidebar__input').blur().prop('disabled', true).attr('aria-disabled', 'true').addClass('is-locked');
            $('.cselect__control').prop('disabled', true);

            return; // 도착 선박이므로 추가 예측 로직을 실행하지 않고 종료
        }

        // -- 3시간 미만 경고창 처리 ---
        if (resp.latest.actual_time_point < 3) {
            alert('출항 후 3시간 미만인 선박은 항로 변화가 크지 않아 정확한 예측이 어렵습니다. 잠시 후 다시 조회 해 주세요.');
            // UI 초기화
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
            return; // 경고 후 함수 종료
        }

        const departurePort = { "id": "KRBUS", "country": "한국", "city": "부산", "lat": 35.0999, "lon": 129.111 };

        // 화면 UI 업데이트 (슬라이드에 데이터 반영)
        displayPredictionResults(resp.latest.predictions, departurePort);
        displayTimelineResults(resp.timeline, resp.latest, departurePort);

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

        $('.sidebar__content').removeClass('is-hidden');
        $('.sidebar__input').blur().prop('disabled', true).attr('aria-disabled', 'true').addClass('is-locked');
        $('.cselect__control').prop('disabled', true);

        const markers = [];
        let lastMarker = null;

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
        $('.sidebar__divider').next('.sidebar__arrived-message').remove();
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

    function hasPredictResult() {
        return !$('#predict-content').hasClass('is-hidden');
    }
    function openSaveModal() {
        $('#saveModal').addClass('is-open').attr('aria-hidden', 'false');
    }
    function closeSaveModal() {
        $('#saveModal').removeClass('is-open').attr('aria-hidden', 'true');
    }
    $(document).on('click', '.sidebar__btn.save', function () {
        if (!hasPredictResult()) {
            alert('먼저 [조회]를 실행해 결과를 확인한 뒤 저장버튼을 클릭해주세요.');
            return;
        }
        openSaveModal();
    });
    $(document).on('click', '#saveModal [data-action="no"]', function () {
        closeSaveModal();
    });
    $(document).on('click', '#saveModal .modal__bg, #saveModal [data-action="close"]', function () {
        closeSaveModal();
    });
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#saveModal').hasClass('is-open')) {
            closeSaveModal();
        }
    });
    $(document).on('click', '#saveModal [data-action="yes"]', function () {
        closeSaveModal();
        setTimeout(function () {
            alert('저장되었습니다. "마이페이지 > 내 선박 정보" 에서 확인하세요.');
        }, 50);
    });
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
        return;
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
    } else {
        alert('일치하는 선박 정보가 없습니다.');
        $('#predict-content').addClass('is-hidden');
    }
}