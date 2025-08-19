// 안전 가드: 채팅 모듈이 늦게 로드되면 임시 안내
if (typeof window.startChat !== 'function') {
    window.startChat = function () {
        alert('채팅 모듈이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    };
}