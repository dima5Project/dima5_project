// 화살표 누르면 아래로 이동 

document.addEventListener('DOMContentLoaded', function () {
    // scroll-indicator-link 클래스를 가진 <a> 태그를 선택자로 지정
    const scrollTrigger = document.querySelector('.scroll-indicator-link');
    const serviceSection = document.querySelector('.service');

    if (scrollTrigger && serviceSection) {
        scrollTrigger.addEventListener('click', function (e) {
            // <a> 태그의 기본 동작(점프)을 막습니다.
            e.preventDefault();

            // scrollTo() 메서드로 부드러운 스크롤 효과를 줍니다.
            serviceSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
});