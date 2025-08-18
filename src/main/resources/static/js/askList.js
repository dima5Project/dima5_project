console.log('askList.js loaded'); // 

document.addEventListener('DOMContentLoaded', function () {
    const tbody = document.querySelector('tbody');

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

    searchBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const keyword = searchInput.value.trim().toLowerCase();
        const selected = searchItem.value;

        qnaRows.forEach(row => {
            const dataId = row.getAttribute('data-id');
            const title = row.querySelector('.toggle-password').textContent.trim().toLowerCase();
            const writer = row.children[3].textContent.trim().toLowerCase();

            let match = false;

            if (selected === 'all' || selected === '') {
                // "선택 도 제목 + 작성자" 통합 검색으로 동작
                match = title.includes(keyword) || writer.includes(keyword);
            } else if (selected === 'writer') {
                match = writer.includes(keyword);
            } else if (selected === 'askTitle') {
                match = title.includes(keyword);
            } else {
                match = false; // 방어적으로 false 안전장치
            }

            row.style.display = match ? '' : 'none';
            ['password-row', 'detail-row', 'answer-row'].forEach(cls => {
                const siblingRow = document.querySelector(`.${cls}[data-id="${dataId}"]`);
                if (siblingRow) siblingRow.style.display = match ? '' : 'none';
            });
        });
    });
    // 🔹 엔터로도 검색 실행
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
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
        const pwdInput = passwordRow.querySelector('input[type="password"]');

        function openDetail() {
            passwordRow.classList.add('hidden');
            detailRow.classList.remove('hidden');
            if (hasAnswer && answerRow) {
                answerRow.classList.remove('hidden');
            } else if (answerRow) {
                answerRow.remove();
            }
        }

        if (checkBtn) {
            checkBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // 공개글(입력창 없음)은 바로 열기
                if (!pwdInput) {
                    openDetail();
                    return;
                }

                const pwd = (pwdInput.value || '').trim();
                fetch(`/ask/checkPassword?askSeq=${encodeURIComponent(dataId)}&pwd=${encodeURIComponent(pwd)}`)
                    .then(r => {
                        if (!r.ok) throw new Error('server');
                        return r.json();
                    })
                    .then(valid => {
                        if (valid) openDetail();
                        else {
                            alert('비밀번호가 올바르지 않습니다.');
                            pwdInput.focus();
                        }
                    })
                    .catch(() => alert('잠시 후 다시 시도해주세요.'));
            });
        }

        // 비밀번호 입력창에서 엔터로도 확인 가능
        if (pwdInput) {
            pwdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    checkBtn?.click();
                }
            });
        }
    });
});

/**
 * 페이지네이션
 */
// document.addEventListener('DOMContentLoaded', () => {
//     const pageButtons = document.querySelectorAll('.page-btn');
//     const allQnaSets = [];

//     // 🔹 하나의 문의글 세트는 qna-row ~ answer-row 까지 총 4줄
//     const qnaRows = document.querySelectorAll('.qna-row');
//     qnaRows.forEach(row => {
//         const dataId = row.getAttribute('data-id');
//         const set = document.querySelectorAll(`tr[data-id="${dataId}"]`);
//         allQnaSets.push([...set]); // 배열로 저장
//     });

//     const showPage = (page) => {
//         // 🔹 전체 숨기기
//         allQnaSets.forEach(set => {
//             set.forEach(tr => tr.style.display = 'none');
//         });

//         // 🔹 해당 페이지만 보여주기
//         const startIdx = (page - 1) * 10;
//         const endIdx = startIdx + 10;
//         const visibleSets = allQnaSets.slice(startIdx, endIdx);
//         visibleSets.forEach(set => {
//             set.forEach(tr => tr.style.display = '');
//         });

//         // 🔹 버튼 스타일 업데이트
//         pageButtons.forEach(btn => btn.classList.remove('active'));
//         const clickedBtn = Array.from(pageButtons).find(btn => btn.textContent === String(page));
//         if (clickedBtn) clickedBtn.classList.add('active');
//     };

//     // 🔹 각 페이지 버튼에 이벤트 부여
//     pageButtons.forEach(btn => {
//         btn.addEventListener('click', () => {
//             const label = btn.textContent;
//             if (label === '>') {
//                 // 현재 active인 버튼 찾기
//                 const activeBtn = document.querySelector('.page-btn.active');
//                 const currentPage = Number(activeBtn.textContent);
//                 const nextPage = Math.min(currentPage + 1, 5);
//                 showPage(nextPage);
//             } else {
//                 showPage(Number(label));
//             }
//         });
//     });

//     // 🔹 첫 페이지 기본 표시
//     showPage(1);

//});

// ===== 필터 전용 클라이언트 페이지네이션 =====
document.addEventListener('DOMContentLoaded', () => {
    const pagination = document.querySelector('section.pagination');
    const originalPagerHTML = pagination ? pagination.innerHTML : '';
    const filterBtns = document.querySelectorAll('.filter-btn');

    // qna-row ~ (password/detail/answer) 같은 한 세트 묶기
    const sets = Array.from(document.querySelectorAll('.qna-row')).map(row => {
        const id = row.getAttribute('data-id');
        return Array.from(document.querySelectorAll(`tr[data-id="${id}"]`));
    });

    const hideAll = () => sets.forEach(set => set.forEach(tr => tr.style.display = 'none'));
    const showSets = arr => arr.forEach(set => set.forEach(tr => tr.style.display = ''));

    function buildClientPager(totalPages, onGo) {
        if (!pagination) return;
        pagination.innerHTML = ''; // 서버 페이저 지우고 클라 전용 페이저로 교체

        const makeBtn = (label, cls, disabled = false) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `page-btn ${cls}`.trim();
            b.textContent = label;
            if (disabled) b.disabled = true;
            return b;
        };

        let current = 1;
        const prev = makeBtn('«', 'prev', totalPages <= 1);
        const next = makeBtn('»', 'next', totalPages <= 1);
        pagination.appendChild(prev);

        const numBtns = [];
        for (let i = 1; i <= totalPages; i++) {
            const nb = makeBtn(String(i), 'is-num');
            nb.addEventListener('click', () => go(i));
            pagination.appendChild(nb);
            numBtns.push(nb);
        }
        pagination.appendChild(next);

        prev.addEventListener('click', () => go(Math.max(1, current - 1)));
        next.addEventListener('click', () => go(Math.min(totalPages, current + 1)));

        function go(page) {
            current = page;
            numBtns.forEach(b => b.classList.toggle('active', Number(b.textContent) === page));
            prev.disabled = page === 1;
            next.disabled = page === totalPages;
            onGo(page);
        }

        go(1); // 첫 페이지 표시
    }

    function applyFilter(label) {
        const filtered = sets.filter(set => {
            const cat = set[0].getAttribute('data-category');
            return label === '전체' || cat === label;
        });

        if (label === '전체') {
            // 서버 페이징 모드 복구
            if (pagination) pagination.innerHTML = originalPagerHTML;
            // 현재 서버 페이지에 로드된 행들은 모두 보이도록
            showSets(sets);
            return;
        }

        // 필터 모드 → 클라이언트 페이징
        hideAll();
        const totalPages = Math.max(1, Math.ceil(filtered.length / 10));

        buildClientPager(totalPages, (page) => {
            hideAll();
            const start = (page - 1) * 10;
            const end = start + 10;
            showSets(filtered.slice(start, end));
        });
    }

    // 기존 필터 클릭 이후에 이 로직을 추가로 실행 (HTML은 그대로)
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => applyFilter(btn.textContent.trim()));
    });
});
