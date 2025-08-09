document.addEventListener('DOMContentLoaded', function () {
    const tbody = document.querySelector('tbody');

    /**
     * 1. 더미 데이터 뿌리기 (6~50번)
     */
    for (let i = 6; i <= 50; i++) {
        const row = document.createElement('tr');
        row.classList.add('qna-row');
        row.setAttribute('data-id', i);

        const categoryList = ['서비스 이용', '회원가입', '기타'];
        const currentCategory = categoryList[i % 3];

        row.setAttribute('data-category', currentCategory);
        row.innerHTML = `
      <td>${i}</td>
      <td>${currentCategory}</td>
      <td class="toggle-password">자동생성 문의글입니다. [비밀글]</td>
      <td>사용자${i}</td>
      <td>2025-08-${String(i).padStart(2, '0')}</td>
    `;
        tbody.appendChild(row);

        const passwordRow = document.createElement('tr');
        passwordRow.className = 'password-row hidden';
        passwordRow.setAttribute('data-id', i);
        passwordRow.innerHTML = `
      <td colspan="5">
        <input type="password" placeholder="비밀번호 입력">
        <button class="check-btn">확인</button>
      </td>
    `;

        const detailRow = document.createElement('tr');
        detailRow.className = 'detail-row hidden';
        detailRow.setAttribute('data-id', i);
        detailRow.innerHTML = `<td colspan="5">자동 생성된 문의 내용입니다.</td>`;

        const answerRow = document.createElement('tr');
        answerRow.className = 'answer-row hidden';
        answerRow.setAttribute('data-id', i);
        answerRow.innerHTML = `<td colspan="5">[답변] 준비 중입니다.</td>`;

        tbody.appendChild(passwordRow);
        tbody.appendChild(detailRow);
        tbody.appendChild(answerRow);
    }

    /**
     * 2. 이벤트 연결 (이제 모든 row에 적용 가능)
     */
    const qnaRows = document.querySelectorAll('.qna-row');
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const selectedCategory = this.textContent.trim();

            qnaRows.forEach(row => {
                const category = row.getAttribute('data-category');
                row.style.display = (selectedCategory === "전체" || category === selectedCategory) ? "" : "none";
            });

            const allRows = document.querySelectorAll('tbody tr');
            allRows.forEach(row => {
                const dataId = row.getAttribute('data-id');
                const parentRow = document.querySelector(`.qna-row[data-id="${dataId}"]`);
                const parentVisible = parentRow && parentRow.style.display !== "none";

                if (row.classList.contains('password-row') ||
                    row.classList.contains('detail-row') ||
                    row.classList.contains('answer-row')) {
                    row.style.display = parentVisible ? "" : "none";
                }
            });
        });
    });

    /**
     * 3. 검색 기능
     */
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('input[name="searchWord"]');
    const searchItem = document.querySelector('select[name="searchItem"]');

    searchBtn.addEventListener('click', function () {
        const keyword = searchInput.value.trim().toLowerCase();
        const selected = searchItem.value;

        qnaRows.forEach(row => {
            const dataId = row.getAttribute('data-id');
            const title = row.querySelector('.toggle-password').textContent.trim().toLowerCase();
            const writer = row.children[3].textContent.trim().toLowerCase();

            let match = false;

            if (selected === 'all') {
                match = title.includes(keyword) || writer.includes(keyword);
            } else if (selected === 'qnaWriter') {
                match = writer.includes(keyword);
            } else if (selected === 'qnaTitle') {
                match = title.includes(keyword);
            } else {
                match = true;
            }

            row.style.display = match ? '' : 'none';
            ['password-row', 'detail-row', 'answer-row'].forEach(cls => {
                const siblingRow = document.querySelector(`.${cls}[data-id="${dataId}"]`);
                if (siblingRow) siblingRow.style.display = match ? '' : 'none';
            });
        });
    });

    /**
     * 4. 제목 클릭 → 비번 확인 → 상세내용 표시
     */
    qnaRows.forEach(row => {
        const dataId = row.getAttribute('data-id');
        const toggleCell = row.querySelector('.toggle-password');
        const passwordRow = document.querySelector(`.password-row[data-id="${dataId}"]`);
        const detailRow = document.querySelector(`.detail-row[data-id="${dataId}"]`);
        const answerRow = document.querySelector(`.answer-row[data-id="${dataId}"]`);

        let hasAnswer = answerRow && !answerRow.textContent.includes('준비 중');

        if (toggleCell) {
            toggleCell.addEventListener('click', () => {
                const isHidden = passwordRow.classList.contains('hidden');
                document.querySelectorAll('.password-row').forEach(r => r.classList.add('hidden'));
                document.querySelectorAll('.detail-row').forEach(r => r.classList.add('hidden'));
                document.querySelectorAll('.answer-row').forEach(r => r.classList.add('hidden'));

                if (isHidden) passwordRow.classList.remove('hidden');
            });
        }

        const checkBtn = passwordRow.querySelector('.check-btn');
        checkBtn.addEventListener('click', () => {
            passwordRow.classList.add('hidden');
            detailRow.classList.remove('hidden');
            if (hasAnswer && answerRow) {
                answerRow.classList.remove('hidden');
            } else if (answerRow) {
                answerRow.remove();
            }
        });
    });
});

/**
 * 페이지네이션
 */
document.addEventListener('DOMContentLoaded', () => {
    const pageButtons = document.querySelectorAll('.page-btn');
    const allQnaSets = [];

    // 🔹 하나의 문의글 세트는 qna-row ~ answer-row 까지 총 4줄
    const qnaRows = document.querySelectorAll('.qna-row');
    qnaRows.forEach(row => {
        const dataId = row.getAttribute('data-id');
        const set = document.querySelectorAll(`tr[data-id="${dataId}"]`);
        allQnaSets.push([...set]); // 배열로 저장
    });

    const showPage = (page) => {
        // 🔹 전체 숨기기
        allQnaSets.forEach(set => {
            set.forEach(tr => tr.style.display = 'none');
        });

        // 🔹 해당 페이지만 보여주기
        const startIdx = (page - 1) * 10;
        const endIdx = startIdx + 10;
        const visibleSets = allQnaSets.slice(startIdx, endIdx);
        visibleSets.forEach(set => {
            set.forEach(tr => tr.style.display = '');
        });

        // 🔹 버튼 스타일 업데이트
        pageButtons.forEach(btn => btn.classList.remove('active'));
        const clickedBtn = Array.from(pageButtons).find(btn => btn.textContent === String(page));
        if (clickedBtn) clickedBtn.classList.add('active');
    };

    // 🔹 각 페이지 버튼에 이벤트 부여
    pageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const label = btn.textContent;
            if (label === '>') {
                // 현재 active인 버튼 찾기
                const activeBtn = document.querySelector('.page-btn.active');
                const currentPage = Number(activeBtn.textContent);
                const nextPage = Math.min(currentPage + 1, 5);
                showPage(nextPage);
            } else {
                showPage(Number(label));
            }
        });
    });

    // 🔹 첫 페이지 기본 표시
    showPage(1);


});
