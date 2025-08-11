// askList.js (통합 완전판)
// - 검색 + 필터 + 페이지네이션 연동
// - URL 상태 유지(searchItem, searchWord, category, page)
// - 엔터 검색 지원 / 폼 submit 방지
// - 0건 처리 메시지
// - 비밀번호 서버 검증 + 답변 토글 (페이지 변경 시에도 이벤트 재연결)

document.addEventListener('DOMContentLoaded', function () {
    const tbody = document.querySelector('tbody');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('input[name="searchWord"]');
    const searchItem = document.querySelector('select[name="searchItem"]');
    const pageButtons = document.querySelectorAll('.page-btn');
    const form = document.querySelector('.qna-search-right'); // 검색 폼

    // --------------------------------
    // 0) URL 상태 관리 유틸
    // --------------------------------
    function getStateFromURL() {
        const p = new URLSearchParams(location.search);
        return {
            searchItem: p.get('searchItem') || 'askTitle',
            searchWord: p.get('searchWord') || '',
            category: p.get('category') || '전체',
            page: Math.max(1, parseInt(p.get('page') || '1', 10))
        };
    }

    function setStateToURL(next) {
        const p = new URLSearchParams(location.search);
        if (next.searchItem !== undefined) p.set('searchItem', next.searchItem);
        if (next.searchWord !== undefined) p.set('searchWord', next.searchWord);
        if (next.category !== undefined) p.set('category', next.category);
        if (next.page !== undefined) p.set('page', String(next.page));
        history.replaceState(null, '', `${location.pathname}?${p.toString()}`);
    }

    // --------------------------------
    // 1) 더미 데이터 (서버 렌더 없이도 테스트용)
    //    서버에서 이미 qna-row들을 내려주면 굳이 안 써도 됨.
    // --------------------------------
    (function generateDummy() {
        // 서버에서 이미 데이터 내려줬으면 생략하고 싶다면 아래 가드 사용:
        // if (document.querySelectorAll('.qna-row').length > 0) return;

        for (let i = 6; i <= 50; i++) {
            const row = document.createElement('tr');
            row.classList.add('qna-row');
            row.setAttribute('data-id', i); // 실제 운영에선 askSeq로 내려주세요!

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
          <div class="password-box">
            <label>비밀번호 입력: </label>
            <input type="password" />
            <button class="check-btn">확인</button>
          </div>
        </td>
      `;

            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row hidden';
            detailRow.setAttribute('data-id', i);
            detailRow.innerHTML = `<td colspan="5"><div class="detail-box">자동 생성된 문의 내용입니다.</div></td>`;

            const answerRow = document.createElement('tr');
            answerRow.className = 'answer-row hidden';
            answerRow.setAttribute('data-id', i);
            answerRow.innerHTML = `<td colspan="5"><div class="answer-box"><strong>↳ 답변</strong> [답변] 준비 중입니다.</div></td>`;

            tbody.appendChild(passwordRow);
            tbody.appendChild(detailRow);
            tbody.appendChild(answerRow);
        }
    })();

    // --------------------------------
    // 2) 필터 + 검색 결과 세트 수집
    //    한 문의글은 qna-row + password-row + detail-row + answer-row = 1세트
    // --------------------------------
    function getFilteredRows() {
        const keyword = searchInput.value.trim().toLowerCase();
        const selected = searchItem.value; // 'all' | 'writer' | 'askTitle'
        const activeFilter = document.querySelector('.filter-btn.active')?.textContent.trim() || '전체';

        const qnaRows = document.querySelectorAll('.qna-row');
        const resultSets = [];

        qnaRows.forEach(row => {
            const dataId = row.getAttribute('data-id');
            const category = row.getAttribute('data-category');
            const title = row.querySelector('.toggle-password')?.textContent.trim().toLowerCase() || '';
            const writer = row.children[3]?.textContent.trim().toLowerCase() || '';

            // 검색 조건
            let match = true;
            if (selected === 'all') {
                match = title.includes(keyword) || writer.includes(keyword);
            } else if (selected === 'writer') {
                match = writer.includes(keyword);
            } else if (selected === 'askTitle') {
                match = title.includes(keyword);
            } // selected가 빈 값이면 전체

            // 필터 조건
            const filterMatch = (activeFilter === '전체' || category === activeFilter);

            if (match && filterMatch) {
                const set = document.querySelectorAll(`tr[data-id="${dataId}"]`);
                resultSets.push([...set]);
            }
        });

        return resultSets;
    }

    // --------------------------------
    // 3) 페이지 표시 (0건 처리 + 버튼 active + 토글 이벤트 재연결)
    // --------------------------------
    function showPage(page, dataSets) {
        // 모두 숨기기
        document.querySelectorAll('tbody tr').forEach(tr => tr.style.display = 'none');

        // 0건 처리
        let emptyRow = document.querySelector('.no-result-row');
        if (dataSets.length === 0) {
            if (!emptyRow) {
                emptyRow = document.createElement('tr');
                emptyRow.className = 'no-result-row';
                emptyRow.innerHTML = '<td colspan="5">검색 결과가 없습니다.</td>';
                tbody.appendChild(emptyRow);
            }
            pageButtons.forEach(btn => btn.classList.remove('active'));
            return;
        } else if (emptyRow) {
            emptyRow.remove();
        }

        // 페이지 범위 보정
        const totalPages = Math.max(1, Math.ceil(dataSets.length / 10));
        const safePage = Math.max(1, Math.min(page, totalPages));

        const startIdx = (safePage - 1) * 10;
        const endIdx = startIdx + 10;
        const visibleSets = dataSets.slice(startIdx, endIdx);

        visibleSets.forEach(set => set.forEach(tr => tr.style.display = ''));

        // 버튼 active
        pageButtons.forEach(btn => btn.classList.remove('active'));
        const matchedBtn = Array.from(pageButtons).find(btn => btn.textContent === String(safePage));
        if (matchedBtn) matchedBtn.classList.add('active');

        // 페이지 바뀔 때마다 토글 이벤트 다시 연결
        attachToggleEvents();

        // URL 상태 반영(페이지만)
        setStateToURL({ page: safePage });
    }

    // --------------------------------
    // 4) 비밀번호 확인 + 답변 토글 (서버 검증)
    // --------------------------------
    function attachToggleEvents() {
        document.querySelectorAll('.qna-row').forEach(row => {
            if (row.style.display === 'none') return; // 숨겨진 행은 스킵(페이지 외 세트)

            const dataId = row.getAttribute('data-id');
            const toggleCell = row.querySelector('.toggle-password');
            const passwordRow = document.querySelector(`.password-row[data-id="${dataId}"]`);
            const detailRow = document.querySelector(`.detail-row[data-id="${dataId}"]`);
            const answerRow = document.querySelector(`.answer-row[data-id="${dataId}"]`);

            if (!toggleCell || !passwordRow || !detailRow) return;

            // 중복 바인딩 방지
            toggleCell.onclick = null;
            const checkBtn = passwordRow.querySelector('.check-btn');
            if (checkBtn) checkBtn.onclick = null;

            const showOnlyThisSet = () => {
                document.querySelectorAll('.password-row').forEach(r => r.classList.add('hidden'));
                document.querySelectorAll('.detail-row').forEach(r => r.classList.add('hidden'));
                document.querySelectorAll('.answer-row').forEach(r => r.classList.add('hidden'));
            };

            // 제목 클릭 → 비번창 토글
            toggleCell.onclick = () => {
                const isHidden = passwordRow.classList.contains('hidden');
                showOnlyThisSet();
                if (isHidden) passwordRow.classList.remove('hidden');
            };

            // 상세 열기 공통
            const openDetail = () => {
                passwordRow.classList.add('hidden');
                detailRow.classList.remove('hidden');
                const hasAnswer = answerRow && !answerRow.textContent.includes('준비 중');
                if (hasAnswer) {
                    answerRow.classList.remove('hidden');
                } else if (answerRow) {
                    // 실제 답변 없으면 제거(선택)
                    answerRow.remove();
                }
            };

            // 엔터 제출
            const pwdInput = passwordRow.querySelector('input[type="password"]');
            if (pwdInput) {
                pwdInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        checkPasswordAndOpen();
                    }
                };
            }

            // 서버 검증
            function checkPasswordAndOpen() {
                const inputPwd = (pwdInput?.value || '').trim();

                fetch(`/ask/checkPassword?askSeq=${encodeURIComponent(dataId)}&pwd=${encodeURIComponent(inputPwd)}`)
                    .then(res => {
                        if (!res.ok) throw new Error('서버 통신 오류');
                        return res.json();
                    })
                    .then(valid => {
                        if (valid) {
                            openDetail();
                        } else {
                            alert('비밀번호가 올바르지 않습니다.');
                            pwdInput?.focus();
                        }
                    })
                    .catch(() => alert('잠시 후 다시 시도해주세요.'));
            }

            if (checkBtn) {
                checkBtn.onclick = (e) => {
                    e.preventDefault();
                    checkPasswordAndOpen();
                };
            }
        });
    }

    // --------------------------------
    // 5) 필터 버튼: 상태 유지 + 페이지 1로
    // --------------------------------
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            setStateToURL({
                category: this.textContent.trim(),
                searchItem: searchItem.value,
                searchWord: searchInput.value.trim(),
                page: 1
            });

            const filtered = getFilteredRows();
            showPage(1, filtered);
        });
    });

    // --------------------------------
    // 6) 검색(버튼/엔터): 상태 유지 + 페이지 1로
    // --------------------------------
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            setStateToURL({
                searchItem: searchItem.value,
                searchWord: searchInput.value.trim(),
                page: 1
            });
            const filtered = getFilteredRows();
            showPage(1, filtered);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            setStateToURL({
                searchItem: searchItem.value,
                searchWord: searchInput.value.trim(),
                page: 1
            });
            const filtered = getFilteredRows();
            showPage(1, filtered);
        });
    }

    // --------------------------------
    // 7) 페이지 버튼: 현재 상태 유지 + page만 갱신
    // --------------------------------
    pageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filtered = getFilteredRows();
            const label = btn.textContent;

            const activeBtn = document.querySelector('.page-btn.active');
            const currentPage = Number(activeBtn?.textContent || '1');
            const totalPages = Math.max(1, Math.ceil(filtered.length / 10));

            let nextPage = currentPage;
            if (label === '>') nextPage = Math.min(currentPage + 1, totalPages);
            else nextPage = Math.max(1, Math.min(Number(label), totalPages));

            setStateToURL({
                searchItem: searchItem.value,
                searchWord: searchInput.value.trim(),
                category: document.querySelector('.filter-btn.active')?.textContent.trim() || '전체',
                page: nextPage
            });

            showPage(nextPage, filtered);
        });
    });

    // --------------------------------
    // 8) 초기 로드: URL 상태 복원 → 필터/검색 UI 세팅 → 페이지 표시
    // --------------------------------
    const urlState = getStateFromURL();

    // 검색 UI 복원
    if (searchItem) searchItem.value = urlState.searchItem;
    if (searchInput) searchInput.value = urlState.searchWord;

    // 카테고리 버튼 active 복원
    const btnToActive = Array.from(filterButtons)
        .find(b => b.textContent.trim() === urlState.category) || filterButtons[0];
    filterButtons.forEach(b => b.classList.remove('active'));
    btnToActive?.classList.add('active');

    // 초기 렌더
    const initial = getFilteredRows();
    showPage(urlState.page, initial);
});
