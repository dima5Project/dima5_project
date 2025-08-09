document.addEventListener('DOMContentLoaded', function () {// defer를 사용해도 이거 해주는 것이 안정성이 더 높음

    // DOM 요소 가져오기
    const backButton = document.getElementById('backButton');
    const form = document.querySelector('.signup_form');
    const signupButton = document.querySelector('.btn_full_width');
    const nameInput = document.getElementById('name');
    const userIdInput = document.getElementById('user_id');
    const duplicateCheckButton = document.querySelector('.input_group .btn_dark');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password_confirm');
    const emailLocalInput = document.getElementById('email_local');
    const emailDomainSelect = document.getElementById('email_domain');
    const emailDomainInput = document.getElementById('email_domain_input');
    const fullEmailInput = document.getElementById('full_email');
    const userTypeInputs = document.querySelectorAll('input[name="userType"]');

    // 에러 메시지 요소 가져오기
    const nameError = document.getElementById('nameError');
    const userIdError = document.getElementById('idError');
    const userIdSuccess = document.getElementById('idSuccess');
    const passwordError = passwordInput.closest('.form_group').querySelector('.error_message');
    const passwordMatchError = passwordConfirmInput.closest('.form_group').querySelector('.error_message');
    const emailError = document.getElementById('emailError');
    const userTypeError = document.getElementById('userTypeError');

    // 전역 변수
    let isNameValid = false;
    let isIdValid = false; // 아이디 유효성 체크
    let isIdConfirmed = false; // 아이디 중복 체크
    let isPasswordValid = false;
    let isPasswordConfirmed = false;
    let isEmailValid = false;
    let isUserTypeChecked = false;

    // 모든 에러/성공 메시지 초기화
    function hideMessages() {
        document.querySelectorAll('.error_message, .success_message').forEach(p => p.style.display = 'none');
    }

    // 특정 메시지 표시 함수
    function showMessage(element, type, message) {
        const msgElement = element.closest('.form_group').querySelector(`.${type}_message`);
        if (msgElement) {
            msgElement.textContent = message;
            msgElement.style.display = 'block';
        }
    }

    // 회원가입 버튼 활성화/비활성화
    function checkFormValidity() {
        isUserTypeChecked = Array.from(userTypeInputs).some(r => r.checked);

        const isFormValid = isNameValid &&
            isIdValid &&
            isIdConfirmed &&
            isPasswordValid &&
            isPasswordConfirmed &&
            isEmailValid &&
            isUserTypeChecked;

        if (isFormValid) {
            signupButton.disabled = false;
            signupButton.style.opacity = '1';
        } else {
            signupButton.disabled = true;
            signupButton.style.opacity = '0.5';
        }
    }

    // 0. 뒤로 가기 버튼 기능
    if (backButton) {
        backButton.addEventListener('click', function (event) {
            event.preventDefault();
            history.back();
        });
    }

    // 1. 이름 입력 유무 확인
    nameInput.addEventListener('input', function () {
        const nameVal = this.value.trim();
        if (nameVal === '') {
            nameError.style.display = 'none';
            isNameValid = false;
        } else {
            nameError.style.display = 'none';
            isNameValid = true;
        }
        checkFormValidity();
    });

    // 2-1. 아이디 유효성 검사
    userIdInput.addEventListener('input', function () {
        hideMessages();
        const regex = /^[a-zA-Z]{5,10}$/;
        const val = this.value.trim();

        if (val === '') { //입력값 없으면 메시지 안 뜸
            isIdValid = false;
            isIdConfirmed = false;
        } else if (!regex.test(val)) {
            showMessage(this, 'error', '영문 5~10자로 입력하세요');
            isIdValid = false;
            isIdConfirmed = false;
        } else {
            // 형식이 올바르면 에러 메시지 숨김
            document.getElementById('idError').style.display = 'none';
            document.getElementById('idSuccess').style.display = 'none';
            isIdValid = true;
            isIdConfirmed = false; // 재입력했으니 중복확인 상태 초기화
        }
        checkFormValidity();
    });

    // 2-2. 중복 확인 버튼 기능 (백엔드와 연동 필요)
    duplicateCheckButton.addEventListener('click', function () {
        if (!isIdValid) {
            showMessage(userIdInput, 'error', '영문 5~10자로 입력하세요');
            return;
        }

        $.ajax({
            url: '/user/confirmId'
            , method: 'POST'
            , data: { "userId": $("#user_id").val().trim() }
            , success: function (resp) {
                if (resp) {
                    $("#idSuccess").html('사용 가능한 아이디입니다')
                    isIdConfirmed = true;
                } else {
                    $('#idError').html('이미 존재하는 아이디입니다')
                    isIdConfirmed = false;
                }
            }
        })

        checkFormValidity();
    });

    // 3. 비밀번호 유효성 검사
    passwordInput.addEventListener('input', function () {
        const regex = /^[a-zA-Z]{5,10}$/;
        const val = this.value.trim();

        if (val === '') { // 입력값 없으면 메시지 숨김
            showMessage(this, 'error', '');
            isPasswordValid = false;
        } else if (!regex.test(val)) {
            showMessage(this, 'error', '영문 5~10자로 입력하세요');
            isPasswordValid = false;
        } else {
            showMessage(this, 'error', '');
            isPasswordValid = true;
        }
        checkPasswordMatch();
        checkFormValidity();
    });

    // 4. 비밀번호 확인 일치 여부
    passwordConfirmInput.addEventListener('input', checkPasswordMatch);

    function checkPasswordMatch() {
        const val = passwordConfirmInput.value.trim();
        if (val === '') { // 입력값 없으면 메시지 숨김
            showMessage(passwordConfirmInput, 'error', '');
            isPasswordConfirmed = false;
        } else if (passwordInput.value !== val) {
            showMessage(passwordConfirmInput, 'error', '비밀번호가 일치하지 않습니다');
            isPasswordConfirmed = false;
        } else {
            showMessage(passwordConfirmInput, 'error', '');
            isPasswordConfirmed = true;
        }
        checkFormValidity();
    }

    // 5. 이메일 도메인 처리
    emailLocalInput.addEventListener('input', checkEmailValidity);
    emailDomainSelect.addEventListener('change', checkEmailValidity);
    emailDomainInput.addEventListener('input', checkEmailValidity);

    // 직접 입력 input에서 포커스를 잃었을 때 동작
    // input이 비어있다면, select를 다시 표시
    emailDomainInput.addEventListener('blur', function () {
        if (this.value.trim() === '') {
            this.style.display = 'none';
            emailDomainSelect.style.display = 'inline-block';
            emailDomainSelect.value = 'naver.com';
        }
        checkEmailValidity();
    });

    function checkEmailValidity() {
        const local = emailLocalInput.value.trim();
        let domain = emailDomainSelect.value;
        if (domain === 'custom') {
            domain = emailDomainInput.value.trim();
        }

        if (local === '') { // 입력값 없으면 메시지 숨김
            emailError.style.display = 'none';
            isEmailValid = false;
            checkFormValidity();
            return; // 함수 실행을 여기서 중단
        }

        // select의 값이 변경될 때 동작
        // 직접입력 옵션을 선택하면 select 숨김, input 보여줌 /  다른 옵션을 선택하면 반대로
        if (domain === 'custom') {
            emailDomainSelect.style.display = 'none';
            emailDomainInput.style.display = 'inline-block';
            if (document.activeElement !== emailDomainInput) {
                emailDomainInput.focus();
            }
        } else {
            emailDomainInput.style.display = 'none';
            emailDomainInput.value = '';
            emailDomainSelect.style.display = 'inline-block';
        }

        // 사용자 입력 누락 방지, 도메인 형식 검증
        if (!local || !domain || !domain.includes('.')) {
            emailError.textContent = '올바른 이메일 주소를 입력하세요';
            emailError.style.display = 'block';
            isEmailValid = false;
        } else {
            emailError.style.display = 'none';
            isEmailValid = true;
        }
        checkFormValidity();
    }

    // 6. 사용자 유형 라디오 버튼 선택/해제 기능
    // 선택을 해제하면 사용자 유형 선택하라는 에러 메세지 표시
    let lastCheckedUserType = null;
    userTypeInputs.forEach(radio => {
        radio.addEventListener('click', function () {
            if (this === lastCheckedUserType) {
                this.checked = false;
                lastCheckedUserType = null;
                userTypeError.style.display = 'block';
            } else {
                lastCheckedUserType = this;
                userTypeError.style.display = 'none';
            }
            checkFormValidity();
        });
    });

    // 7. 가입하기 버튼 클릭 시 최종 유효성 검사
    form.addEventListener('submit', function (event) {
        // 모든 메시지 초기화
        hideMessages();
        let isValid = true;

        // 이름 유효성
        if (nameInput.value.trim() === '') {
            showMessage(nameInput, 'error', '이름을 입력하세요');
            isValid = false;
        }
        // 아이디 유효성
        if (!isIdValid) {
            showMessage(userIdInput, 'error', '영문 5~10자로 입력하세요');
            isValid = false;
        }
        if (!isIdConfirmed) {
            showMessage(userIdInput, 'error', '아이디 중복 확인이 필요합니다');
            isValid = false;
        }
        // 비밀번호 유효성
        if (!isPasswordValid) {
            showMessage(passwordInput, 'error', '영문 5~10자로 입력하세요');
            isValid = false;
        }
        // 비밀번호 확인
        if (!isPasswordConfirmed) {
            showMessage(passwordConfirmInput, 'error', '비밀번호가 일치하지 않습니다');
            isValid = false;
        }
        // 이메일 유효성
        if (!isEmailValid) {
            emailError.textContent = '올바른 이메일 주소를 입력하세요';
            emailError.style.display = 'block';
            isValid = false;
        } else {
            fullEmailInput.value = `${emailLocalInput.value.trim()}@${emailDomainSelect.value === 'custom' ? emailDomainInput.value.trim() : emailDomainSelect.value}`;
        }
        // 사용자 유형
        if (!isUserTypeChecked) {
            userTypeError.style.display = 'block';
            isValid = false;
        }

        // 유효성 검사 실패 시 폼 제출 방지
        if (!isValid) {
            event.preventDefault();
        }
    });

    // 페이지 로드 시 초기 상태 설정
    checkEmailValidity();
    checkFormValidity();
});









