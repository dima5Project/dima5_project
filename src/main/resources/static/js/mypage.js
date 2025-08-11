/*
** 마이페이지 내선박 저장
    1. 삭제 버튼 클릭 시 alert창 발생
    2. 삭제 확인 누르면 해당 행 삭제
*/

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (confirm('해당 내역을 삭제하시겠습니까?')) {
                row.remove();
            }
        });
    });
});