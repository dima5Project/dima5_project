// translator.js - Google Translate 기반 웹사이트 번역 스크립트

// 1) 전역 콜백: 구글 스크립트가 이 함수를 호출합니다.
window.googleTranslateElementInit = function () {
    console.log("[Google Translate] googleTranslateElementInit 호출됨");
    new google.translate.TranslateElement({
        pageLanguage: 'ko',
        includedLanguages: 'ko,en,ja', // 한국어/영어/일본어
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
};

// 2) 구글 번역 스크립트 로드 (중복 방지)
(function loadGTranslate() {
    if (document.getElementById('gtranslate-loader')) return;
    const s = document.createElement('script');
    s.id = 'gtranslate-loader';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.type = 'text/javascript';
    document.head.appendChild(s);
})();

// 3) 유틸: 콤보가 생성될 때까지 기다렸다가 콜백 실행
function waitForCombo(callback, timeout = 7000) {
    const start = performance.now();
    (function loop() {
        const select = document.querySelector('select.goog-te-combo');
        if (select) return callback(select);
        if (performance.now() - start > timeout) {
            console.warn("[Google Translate] Timeout waiting for the combo box.");
            return; // 타임아웃 시 조용히 종료
        }
        requestAnimationFrame(loop);
    })();
}

// 4) 언어 버튼 이벤트 & 저장된 언어 복원
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'site.lang';

    // (a) 클릭 시 적용
    document.querySelectorAll('#submenu_lang .lang_item').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang; // HTML의 data-lang 속성값을 바로 사용
            if (!lang) return;
            localStorage.setItem(STORAGE_KEY, lang);
            waitForCombo(select => {
                if (select.value !== lang) {
                    select.value = lang;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    });

    // (b) 페이지 로드 시 저장된 언어 적용
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        waitForCombo(select => {
            if (select.value !== saved) {
                select.value = saved;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }
});