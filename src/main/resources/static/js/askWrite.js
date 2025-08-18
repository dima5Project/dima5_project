// 공개여부 -> '공개'일때 비밀번호 입력행 숨기기

(function () {
    const pub = document.getElementById('public');
    const pri = document.getElementById('private');
    const pw = document.getElementById('askPwd');
    const pwRow = document.getElementById('pw-row'); // 추가: 비밀번호 행을 선택

    function sync() {
        if (pri.checked) {
            pwRow.style.display = 'grid'; // 추가: 비공개일 때 다시 보이게 함
            pw.disabled = false;
            pw.required = true;
        } else { // public.checked
            pwRow.style.display = 'none'; // 추가: 공개일 때 행 전체를 숨김
            pw.value = '';
            pw.disabled = true;
            pw.required = false;
        }
    }
    pub.addEventListener('change', sync);
    pri.addEventListener('change', sync);
    sync(); // 초기 반영
})();