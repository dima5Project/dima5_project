/*
** 마이페이지 내선박 저장
    1. 삭제 버튼 클릭 시 confirm 창 발생
    2. 삭제 확인 누르면 서버에 삭제 요청 후 성공 시 해당 행 삭제
*/

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const saveSeq = e.target.getAttribute('data-id'); // saveSeq 가져오기
            const row = e.target.closest('tr');

            if (confirm('해당 내역을 삭제하시겠습니까?')) {
                // 서버에 DELETE 요청 보내기
                fetch(`/mypage/delete/${saveSeq}`, { 
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        // 서버에서 삭제 성공 시에만 화면에서 행 제거
                        row.remove();
                        alert('삭제되었습니다.');
                        // 필요하다면 페이지 전체 새로고침
                        // window.location.reload();
                    } else {
                        alert('삭제에 실패했습니다.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('삭제 중 오류가 발생했습니다.');
                });
            }
        });
    });
});