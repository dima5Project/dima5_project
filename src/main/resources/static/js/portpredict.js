$(function () {
    // 사이드바 토글
    $(document).on('click', '.sidebar__handle', function () {
        const $sidebar = $('.sidebar');
        const isCollapsed = $sidebar.toggleClass('is-collapsed').hasClass('is-collapsed');
        $(this).attr('aria-expanded', !isCollapsed);
    });
});


// 조회 버튼: 클릭 이벤트 (임시 테스트 모드)
$(document).on('click', '.sidebar__btn.primary', function () {
    const selectValue = $('.cselect__value').attr('data-value'); // 드롭다운 선택 값
    const inputValue = $('.sidebar__input').val().trim();        // 입력 값

    if (!selectValue || !inputValue) {
        alert('옵션과 값을 모두 입력하세요.');
        return;
    }

    $('.sidebar__content').removeClass('is-hidden'); // 결과 영역 보이기
    $('.sidebar__input')
        .blur()                       // 커서(포커스) 즉시 제거
        .prop('disabled', true)       // 폼 입력 비활성
        .attr('aria-disabled', 'true')
        .addClass('is-locked');
    $('.cselect__control').prop('disabled', true);      // 🔒 셀렉트 잠금


    // ===== 나중에 백엔드 붙일 때는 아래 원래 AJAX 복원 =====
    /*
    $.ajax({
        url: '/api/vessel-info', // API 엔드포인트
        method: 'GET',
        data: {
            type: selectValue,
            query: inputValue
        },
        success: function (response) {
            $('.sidebar__content').html(response);
        },
        error: function () {
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    });
    */
});


// 초기화 버튼 : 페이지 최초 상태로 되돌리기
$(document).on('click', '.sidebar__row .sidebar__btn:not(.primary)', function () {
    // 1) 입력값 비우기
    $('.sidebar__input').val('');

    // 2) 셀렉트(MMSI)로 복구
    const $wrap = $('.cselect');
    $wrap.find('.cselect__option').attr('aria-selected', 'false');
    $wrap.find('.cselect__option[data-value="MMSI"]').attr('aria-selected', 'true');
    $wrap.find('.cselect__value').text('MMSI').attr('data-value', 'MMSI');

    // hidden input 값도 복구
    const name = $wrap.data('name'); // 예: idType
    let $hidden = $wrap.find(`input[type="hidden"][name="${name}"]`);
    if (!$hidden.length) {
        $hidden = $('<input>', { type: 'hidden', name });
        $wrap.append($hidden);
    }
    $hidden.val('MMSI');

    // 드롭다운 닫기
    $wrap.removeClass('is-open').find('.cselect__control').attr('aria-expanded', 'false');

    // 3) 결과 영역 숨기고 스크롤 상단으로
    const $content = $('.sidebar__content');
    $content.scrollTop(0).addClass('is-hidden');

    $('.sidebar__input')
        .prop('disabled', false)
        .removeAttr('aria-disabled')
        .removeClass('is-locked');
    $('.cselect__control').prop('disabled', false);     // 🔓 셀렉트 해제
});





// 간단 토글 + 선택 저장
$(document).on('click', '.cselect__control', function () {
    const $wrap = $(this).closest('.cselect');
    const open = $wrap.toggleClass('is-open').hasClass('is-open');
    $(this).attr('aria-expanded', open);
});

// 옵션 클릭
$(document).on('click', '.cselect__option', function () {
    const $opt = $(this);
    const $wrap = $opt.closest('.cselect');
    const value = $opt.data('value');
    const text = $opt.text();

    // 값/표시 업데이트
    $wrap.find('.cselect__option').attr('aria-selected', 'false');
    $opt.attr('aria-selected', 'true');
    $wrap.find('.cselect__value').text(text).attr('data-value', value);

    // hidden input에 값 저장 (form 전송용)
    const name = $wrap.data('name');
    let $hidden = $wrap.find('input[type="hidden"][name="' + name + '"]');
    if (!$hidden.length) {
        $hidden = $('<input>', { type: 'hidden', name });
        $wrap.append($hidden);
    }
    $hidden.val(value);

    // 닫기
    $wrap.removeClass('is-open').find('.cselect__control').attr('aria-expanded', 'false');
});

// 바깥 클릭 시 닫기
$(document).on('click', function (e) {
    if ($(e.target).closest('.cselect').length === 0) {
        $('.cselect.is-open').removeClass('is-open').find('.cselect__control').attr('aria-expanded', 'false');
    }
});

// 아이콘 
// 초기: predict가 기본 활성
$(function () {
    // predict 탭/패널 기본 활성
    $('.sidebar__topbox .iconwrap[data-panel="predict"]').addClass('is-active');
    $('.panel--predict').addClass('is-active');
});

// 상단 아이콘(버튼) 클릭 → 패널 전환 + 활성 표시
$(document).on('click', '.sidebar__topbox .iconwrap', function () {
    const target = $(this).data('panel'); // 'predict' | 'log'

    // 탭 활성 토글
    $('.sidebar__topbox .iconwrap').removeClass('is-active');
    $(this).addClass('is-active');

    // 패널 전환 (is-active + hidden 속성 토글)
    $('.panel').removeClass('is-active').attr('hidden', true);
    $(`.panel--${target}`).addClass('is-active').removeAttr('hidden');

    // mapbox 리사이즈
    window.dispatchEvent(new Event('resize'));
});



// 아이콘 버튼 클릭 → ON/OFF 토글 + 커스텀 이벤트 알림
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.map-icon-ctrl .iconbtn');
    if (!btn) return;

    const type = btn.dataset.type;            // 'map' | 'congestion' | 'weather'
    const on = !btn.classList.contains('is-on');

    btn.classList.toggle('is-on', on);

    // 기존 로직과 동일: 외부에서 듣고 레이어 on/off 처리
    document.dispatchEvent(new CustomEvent('panel:toggle', {
        detail: { type, on }
    }));
});

/* 예시: 버튼에 따라 동작 다르게 처리 할 경우
document.addEventListener('panel:toggle', (e) => {
  const { type, on } = e.detail;
  if (type === 'map') {
    // 지도 스타일 토글 처리
  } else if (type === 'congestion') {
    // 혼잡도 레이어 on/off
  } else if (type === 'weather') {
    // 날씨 레이어 on/off
  }
});
*/

// 2) 슬라이드 원형 : 회색 <-> 파랑 + 팝 애니메이션
$(document).on('click', '.voy-node', function () {
    const $node = $(this);

    // 색상/상태 토글 (기존 동작)
    $node.toggleClass('is-active');

    // --- 클릭 팝 애니메이션 ---
    $node.addClass('is-pop');              // scale up
    const prev = $node.data('popTimer');   // 이전 타이머 있으면 정리
    if (prev) clearTimeout(prev);
    const timer = setTimeout(() => {
        $node.removeClass('is-pop');       // 원래 크기로 복귀
    }, 180); // CSS transition 시간과 비슷하게
    $node.data('popTimer', timer);
});




// 조회가 끝났는지 여부를 판단하는 헬퍼
function hasPredictResult() {
    // 조회 후 결과 영역이 열려 있으면 true
    return !$('#sidebar-content').hasClass('is-hidden');
}

// 모달 제어
function openSaveModal() {
    $('#saveModal').addClass('is-open').attr('aria-hidden', 'false');
}
function closeSaveModal() {
    $('#saveModal').removeClass('is-open').attr('aria-hidden', 'true');
}

// [결과 저장] 클릭
$(document).on('click', '.sidebar__btn.save', function () {
    if (!hasPredictResult()) {
        alert('먼저 [조회]를 실행해 결과를 확인한 뒤 저장버튼을 클릭해주세요.');
        return;
    }
    openSaveModal();
});

// 모달: 아니오
$(document).on('click', '#saveModal [data-action="no"]', function () {
    // 그냥 닫고, 화면/데이터는 그대로 유지
    closeSaveModal();
});

// 모달: 바깥 클릭으로 닫기
$(document).on('click', '#saveModal .modal__bg, #saveModal [data-action="close"]', function () {
    closeSaveModal();
});

// 모달: ESC로 닫기
$(document).on('keydown', function (e) {
    if (e.key === 'Escape' && $('#saveModal').hasClass('is-open')) {
        closeSaveModal();
    }
});

// 모달: 예 → (테스트) 저장 완료 알림 후 그대로 유지
$(document).on('click', '#saveModal [data-action="yes"]', function () {
    closeSaveModal();

    // 실제 저장 API가 붙기 전 임시 처리
    // ※ 여기서 AJAX 붙이면 됨. 성공 콜백에서 아래 alert 실행.
    setTimeout(function () {
        alert('저장되었습니다. "마이페이지 > 내 선박 정보" 에서 확인하세요.');
    }, 50);
});



