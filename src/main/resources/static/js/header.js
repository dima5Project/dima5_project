document.addEventListener("DOMContentLoaded", () => {
    let nav = document.querySelector(".navbar");
    let currentPath = window.location.pathname; // 페이지 로드 시 URL 확인
    let navItems = document.querySelectorAll('.navbar_menu .nav_item');

    // 언어 드롭다운 (click으로 제어)
    let langToggle = document.getElementById("langToggle");

    if (langToggle) {
        // 드롭다운 열기/닫기 토글 기능 (lang_selector 클릭 시)
        langToggle.addEventListener('click', function (event) {
            event.stopPropagation(); // 버블링 방지
            this.classList.toggle('active');
        });
    }

    // 드롭다운 항목 클릭 시 드롭다운 닫기
    let langItems = document.querySelectorAll('.lang_item');
    langItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.stopPropagation();

            if (langToggle) {
                langToggle.classList.remove('active');
            }

            // 원하는 언어 번역 기능 실행
            // 예를 들어, `item.getAttribute('data-lang')` 값을 이용해 번역 API를 호출
        });
    });

    // 문서의 다른 부분을 클릭했을 때 드롭다운 닫기
    document.addEventListener('click', function (event) {
        // langToggle이 없거나, 클릭된 요소가 langToggle 또는 그 자식이 아닐 때
        if (langToggle && !langToggle.contains(event.target)) {
            langToggle.classList.remove('active');
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
    navItems.forEach(item => {
        let navLink = item.querySelector('.nav_link');

        // 마우스가 메뉴에 올라갔을 때 이벤트
        item.addEventListener('mouseover', function () {
            let submenu = this.querySelector('.submenu');
            let underlineWidth;
            // 서브메뉴가 존재하면 너비를 계산하여 CSS 변수에 저장
            if (submenu) {
                underlineWidth = submenu.offsetWidth;
            } else {
                let navLink = this.querySelector('.nav_link');
                underlineWidth = navLink ? navLink.offsetWidth : 0;
            }
            this.style.setProperty('--underline-width', `${underlineWidth}px`);
        });

        // 마우스가 메뉴에서 벗어났을 때 이벤트
        item.addEventListener('mouseout', function () {
            // CSS 변수 초기화
            this.style.setProperty('--underline-width', '0');
        });

        // 클릭 시 active 클래스를 바로 추가하여 밑줄을 유지
        if (navLink) {
            navLink.addEventListener('click', function () {
                // 기존의 모든 active 클래스를 제거
                document.querySelectorAll('.nav_link.active').forEach(link => {
                    link.classList.remove('active');
                });
                document.querySelectorAll('.nav_item.active').forEach(navItem => {
                    navItem.classList.remove('active');
                });

                // 현재 클릭된 링크에 active 클래스 추가
                this.classList.add('active');
                this.closest('.nav_item').classList.add('active');
            });
        }
    });

    // 햄버거 버튼 요소 가져오기
    let hamburgerMenu = document.querySelector('.hamburger_menu');
    let subNav = document.querySelector('.sub_nav');

    // 햄버거 버튼에 클릭 이벤트 리스너 추가
    hamburgerMenu.addEventListener('click', () => {
        // 'active' 클래스 토글하기
        hamburgerMenu.classList.toggle('active');
        subNav.classList.toggle('active');
    });
});