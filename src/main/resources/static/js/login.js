
// 필요한 DOM 요소 가져오기
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginForm = document.querySelector('.login_form');
const loginButton = document.querySelector('.login_button');
const usernameError = usernameInput.closest('.form_group').querySelector('.error_message');
const passwordError = passwordInput.closest('.form_group').querySelector('.error_message');

const usernameGroup = usernameInput.closest('.form_group');
const passwordGroup = passwordInput.closest('.form_group');

function validateAndSetButtonState() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const usernameRegex = /^[a-zA-Z]{5,10}$/;
    const passwordRegex = /^[a-zA-Z]{5,10}$/;

    let isUsernameValid = false;
    let isPasswordValid = false;

    // 아이디 유효성 검사
    if (username.length > 0) {
        if (usernameRegex.test(username)) {
            usernameError.style.display = 'none';
            usernameGroup.classList.remove('has_error');
            isUsernameValid = true;
        } else {
            usernameError.textContent = '영문 5~10자를 입력하세요.';
            usernameError.style.display = 'block';
            usernameGroup.classList.add('has_error');
        }
    } else {
        usernameError.style.display = 'none';
        usernameGroup.classList.remove('has_error');
        isUsernameValid = false;
    }

    // 비밀번호 유효성 검사
    if (password.length > 0) {
        if (passwordRegex.test(password)) {
            passwordError.style.display = 'none';
            passwordGroup.classList.remove('has_error'); // <-- 올바르게 수정
            isPasswordValid = true;
        } else {
            passwordError.textContent = '영문 5~10자를 입력하세요.';
            passwordError.style.display = 'block';
            passwordGroup.classList.add('has_error'); // <-- 올바르게 수정
        }
    } else {
        passwordError.style.display = 'none';
        passwordGroup.classList.remove('has_error'); // <-- 올바르게 수정
        isPasswordValid = false;
    }

    // 유효성 검사 결과
    const isFormValid = isUsernameValid && isPasswordValid;

    // 로그인 버튼 활성화 상태 관련
    if (isFormValid) {
        loginButton.disabled = false;
        loginButton.style.opacity = '1';
        loginButton.style.cursor = 'pointer';
    } else {
        loginButton.disabled = true;
        loginButton.style.opacity = '0.5';
        loginButton.style.cursor = 'not-allowed';
    }

    return isFormValid;
}

// 아이디 또는 비밀번호 입력란에 글자를 입력할 때마다 validateInupts 함수를 호출하여 실시간으로 유효성 검사
usernameInput.addEventListener('input', validateAndSetButtonState);
passwordInput.addEventListener('input', validateAndSetButtonState);

// 로그인 버튼을 클릭했을 때 발생 이벤트
loginForm.addEventListener('submit', (event) => {
    const isFormValid = validateAndSetButtonState();
    // 버튼 비활성화 상태에는 폼 제출 막음
    if (!isFormValid) {
        event.preventDefault();
    }
});
