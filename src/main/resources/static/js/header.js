document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".navbar");

    // 언어 드롭다운 (click으로 제어)
    const langToggle = document.getElementById("langToggle");

    langToggle.addEventListener("click", (e) => {
        e.stopPropagation();

        // 'active' 클래스를 토글하여 CSS로 드롭다운을 제어합니다.
        langToggle.classList.toggle("active");
    });

    // 외부 클릭 시 언어 드롭다운 닫기
    document.addEventListener("click", (e) => {
        const langWrapper = document.getElementById("submenu_lang_wrapper");

        if (!langToggle.contains(e.target) && !langWrapper.contains(e.target)) {
            langToggle.classList.remove("active");
        }
    });

    // 3. 스크롤 시 navbar 확장 효과
    window.addEventListener("scroll", () => {
        if (window.scrollY > 10) {
            nav.classList.add("expended");
        } else {
            nav.classList.remove("expended");
        }
    });
});