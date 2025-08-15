document.addEventListener("DOMContentLoaded", () => {
    let nav = document.querySelector(".navbar");
    let currentPath = window.location.pathname; // 페이지 로드 시 URL 확인
    let navItems = document.querySelectorAll('.navbar_menu .nav_item');
    let navItemsSubmenu = document.querySelectorAll('.navbar_menu .nav_item.has_submenu');

    // 언어 드롭다운 (click으로 제어)
    let langToggle = document.getElementById("langToggle");

    langToggle.addEventListener("click", (e) => {
        e.stopPropagation();

        // 'active' 클래스를 토글하여 CSS로 드롭다운을 제어합니다.
        langToggle.classList.toggle("active");
    });

    // 외부 클릭 시 언어 드롭다운 닫기
    document.addEventListener("click", (e) => {
        let langWrapper = document.getElementById("submenu_lang_wrapper");

        if (!langToggle.contains(e.target) && !langWrapper.contains(e.target)) {
            langToggle.classList.remove("active");
        }
    });

    // 스크롤 시 navbar 확장 효과
    window.addEventListener("scroll", () => {
        if (window.scrollY > 10) {
            nav.classList.add("expended");
        } else {
            // 이미 expended 클래스가 있다면 제거하지 않음
            if (!nav.dataset.fixedExpended) {
                nav.classList.remove("expended");
            }
        }
    });

    if (currentPath.includes("/predict/init") || currentPath.includes("/predict/search")) {
        nav.classList.add("expended");
        nav.dataset.fixedExpended = "true"; // 스크롤 이벤트에서 제거되지 않도록 플래그 설정
    }


    // 해당 페이지 이동 시 색 표시
    navItems.forEach(item => {
        let activePathPrefix = item.getAttribute('data-active-path-prefix');

        if (activePathPrefix && currentPath.startsWith(activePathPrefix)) {
            item.classList.add('active');
            // 해당 .nav_item 내의 .nav_link에 active 클래스 추가
            let link = item.querySelector('.nav_link');
            if (link) {
                link.classList.add('active');
            }
        }
    });

    // 호버 시 서브메뉴 존재하면 너비 계산
    navItemsSubmenu.forEach(item => {
        // 마우스가 메뉴에 올라갔을 때 이벤트
        item.addEventListener('mouseover', function () {
            const submenu = this.querySelector('.submenu');
            // 서브메뉴가 존재하면 너비를 계산하여 CSS 변수에 저장
            if (submenu) {
                const submenuWidth = submenu.offsetWidth;
                this.style.setProperty('--underline-width', `${submenuWidth}px`);
            }
        });

        // 마우스가 메뉴에서 벗어났을 때 이벤트
        item.addEventListener('mouseout', function () {
            // CSS 변수 초기화
            this.style.setProperty('--underline-width', '0');
        });
    });
});