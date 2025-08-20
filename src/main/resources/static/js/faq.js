// ✅ FAQ 챗봇 전체 동작 JS 파일 (드래그 스크롤 포함)

// XSS 방지(문자 → HTML 이스케이프) 
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
// 멀티라인 문자열/글머리표를 HTML로 변환 
function formatAnswer(a) {
  // 배열이면 각 요소를 단락으로 
  if (Array.isArray(a)) { return a.map(p => `<p>${escapeHtml(p)}</p>`).join(''); }
  // 문자열이면 규칙 적용 
  let text = String(a).trim();
  // 1) 빈 줄(두 번 이상의 \n)은 단락 구분 
  const blocks = text.split(/\n{2,}/);

  // 2) 각 블록 내부 처리: 글머리표(- 또는 •) → <ul>, 그 외는 <p> + 줄바꿈 처리 
  const html = blocks.map(block => {
    const lines = block.split(/\n/); const isList = lines.every(l => /^\s*[-•]\s+/.test(l)); if (isList) { const items = lines.map(l => l.replace(/^\s*[-•]\s+/, '')).map(item => `<li>${escapeHtml(item)}</li>`).join(''); return `<ul class="faq-list" style="margin:6px 0 8px 18px">${items}</ul>`; }
    // 줄바꿈(\n)은 <br>로, 문장 끝(.?! 뒤 공백)은 가볍게 개행 보정 
    const withBreaks = block.replace(/([.!?])\s+/g, '$1<br>').replace(/\n/g, '<br>'); return `<p>${escapeHtml(withBreaks).replace(/&lt;br&gt;/g, '<br>')}</p>`;
  }).join(''); return html;
}

const toggle = document.getElementById('faq-toggle');
const box = document.getElementById('faq-box');
const dialog = document.getElementById('faq-dialog');
const faqBody = document.querySelector('.faq-body');

let isOpen = false; // 열림 상태 저장

function updateToggleIcon() {
  toggle.innerHTML = isOpen
    ? '<span style="font-size:28px;">\u00d7</span>'
    : '<span style="font-size:24px;">?</span>';
}

function toggleBox() {
  isOpen = !isOpen;
  box.classList.toggle('hidden');
  updateToggleIcon();

  if (isOpen) {
    dialog.innerHTML = '';
    dialog.innerHTML += `
      <div class="faq-message assistant">
        <img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />
        <div class="faq-bubble-wrapper">
          <div class="faq-bubble">
            <div class="faq-text">
              안녕하세요.<br />서비스 이용이 처음이라면,<br />FAQ로 빠르게 확인해보세요.
            </div>
            <div class="faq-buttons">
              <button onclick="selectFAQ('회원 / 로그인 관련')">회원 / 로그인 관련</button>
              <button onclick="selectFAQ('예측 서비스 이용 가이드')">예측 서비스 이용 가이드</button>
              <button onclick="selectFAQ('기타 문의')">기타 문의</button>
              <button onclick="startChat()" class="faq-subquestion-button">1:1 상담원 채팅</button>
            </div>
          </div>
          <div class="faq-time">${getTime()}</div>
        </div>
      </div>
    `;
    scrollToBottom();
  }
}

toggle.addEventListener('click', toggleBox);

const faqData = {
  "회원 / 로그인 관련": [
    {
      question: "로그인 / 회원가입이 안 돼요",
      answer: `문의 게시판에 글을 남겨주시거나 portcast@naver.com 
      또는 02-2642-9451로 연락 부탁드립니다.`
    },
    {
      question: "비회원도 예측 기능을 이용할 수 있나요?",
      answer: `비회원은 **소개, 뉴스룸 페이지**만 이용 가능합니다.

**회원가입 후** 이용 가능한 기능
- 차항지 예측
- 부가 정보
- 문의 게시판

총 38개 항구 실시간 정보
- 날씨
- 시차
- 선박 접안 현황 등`
    }
  ],

  "예측 서비스 이용 가이드": [
    {
      question: "어떤 기능을 제공하나요?",
      answer: `AIS 데이터를 기반으로 **선박의 MMSI 혹은 IMO**를 입력하면
차기 정박항 Top 3을 예측합니다.

제공되는 부가정보 :
- ETA
- 현재 위치의 정보(파고, 가시거리 등)
- 항구 접안 선박 수`
    },
    {
      question: `예측은 출항 후 몇 시간부터 가능한가요?`,
      answer: `지원 구간은 **출항 후 3~30시간**입니다.

- 0 ~ 4시간: 출항 직후 분산 구간
- 5 ~ 30시간: 항로가 안정화되는 구간
- 31시간 ~: 이미 목적지로 항로 고정`
    },
    {
      question: `지도가 안 나와요 / 항로가 엉뚱하게 표시돼요`,
      answer: `문의 게시판 또는 portcast@naver.com 으로 문의해주세요.`
    },
    {
      question: `제공하는 나라와 항구는 어디인가요?`,
      answer: `총 38개 항구에서 예측/부가정보를 제공합니다.

- 홍콩(HK) : HKG
- 중국(CN) : DAG, HUA, LYG, NGB, NJI, QDG, RZH, SHA, TAC, TXG
- 일본(JP) : HIJ, HKT, IMB, IMI, KIJ, MKX, MOJ, NGO, NGS, OSA, SMZ, TYO, UKB, WAK, YKK, YOK
- 한국(KR) : INC, KAN, KPO, PTK, YOS
- 대만(TW) : KEL, KHH
- 베트남(VN) : HPH
- 러시아(RU) : NJK, VVO
- 필리핀(PH) : MNL`

    },
    {
      question: "항구 혼잡도는 어떤 지표이며 갱신 주기는 어떻게 되나요?",
      answer: `항구 혼잡도는 Portcast가 데이터를 바탕으로 내부 기준으로 산출한 **참고용 지표**로, 
      항만 주변의 붐빔 정도를 색으로 표현합니다.

갱신 주기
- 약 3시간마다 데이터를 수집·갱신합니다.
- 수집 지연이나 데이터 품질에 따라 약간의 시차가 발생할 수 있습니다.

유의 사항
- 공식 기관이 공표하는 수치가 아니며, 의사결정 시 참고용으로 활용해 주세요.`
    }
  ],

  "기타 문의": [
    {
      question: "기타 문의",
      answer: `1:1 문의, 제휴 제안 등은
portcast@naver.com 또는 02-2642-9451 로 연락 바랍니다.`
    }
  ],


  "1:1 상담원 연결": [
    {
      question: "1:1 상담원 연결",
      answer: `1:1 상담원 연결을 시작합니다.
      질문을 남겨주시면 성실히 답변 드리겠습니다.`
    }
  ]
};

function selectFAQ(category) {
  const currentTime = getTime();
  const sub = faqData[category];

  if (category === "기타 문의") {
    const question = sub[0].question;
    showAnswer(category, question);
    return;
  }

  let buttonsHTML = '';
  sub.forEach(q => {
    buttonsHTML += `<button class="faq-subquestion-button" onclick="showAnswer('${category}', '${q.question}')">${q.question}</button>`;
  });

  dialog.innerHTML += `
    <div class="faq-message user">
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble faq-user-question">${category}</div>
        <div class="faq-time">${currentTime}</div>
      </div>
    </div>
    <div class="faq-message assistant">
      <img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble">
          <div class="faq-buttons">${buttonsHTML}</div>
        </div>
        <div class="faq-time">${currentTime}</div>
      </div>
    </div>
  `;
  scrollToBottom();
}

function showAnswer(category, question) {
  const currentTime = getTime();
  const qa = faqData[category].find(q => q.question === question);

  dialog.innerHTML += `
    <div class="faq-message user">
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble faq-user-question">${question}</div>
        <div class="faq-time">${currentTime}</div>
      </div>
    </div>
    <div class="faq-message assistant">
      <img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble" style="line-height:1.55; max-width:300px;">
        ${formatAnswer(qa.answer)}
        </div>
        <div class="faq-time">${currentTime}</div>
        <div class="faq-nav-buttons">
          ${category === "기타 문의"
      ? `<button class="faq-top">처음으로</button>`
      : `
              <button class="faq-prev" data-category="${category}">이전 질문</button>
              <button class="faq-top">처음으로</button>
            `}
        </div>
      </div>
    </div>
  `;

  const faqMessages = dialog.querySelectorAll('.faq-message.assistant');
  const lastAssistant = faqMessages[faqMessages.length - 1];
  if (lastAssistant.querySelector('.faq-nav-buttons')) {
    lastAssistant.classList.add('nav-type');
  }
  // '기타 문의' 답변 말풍선 아래에 1:1 채팅 버튼 노출
  if (category === "기타 문의") {
    const bubble = lastAssistant.querySelector('.faq-bubble');
    if (bubble && !bubble.querySelector('.faq-livechat-inline')) {
      bubble.insertAdjacentHTML('beforeend', `
      <div class="faq-livechat-inline" style="margin-top:10px">
        <button class="faq-subquestion-button" onclick="startChat()">1:1 상담원 채팅</button>
      </div>
    `);
    }
  }
  scrollToBottom();
}

function renderInitialFAQButtons() {
  const currentTime = getTime();
  dialog.innerHTML += `
    <div class="faq-message assistant">
      <img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble">
          <div class="faq-text">다른 질문도 확인해보세요.</div>
          <div class="faq-buttons">
            <button onclick="selectFAQ('회원 / 로그인 관련')">회원 / 로그인 관련</button>
            <button onclick="selectFAQ('예측 서비스 이용 가이드')">예측 서비스 이용 가이드</button>
            <button onclick="selectFAQ('기타 문의')">기타 문의</button>
            <button onclick="startChat()" class="faq-subquestion-button">1:1 상담원 채팅</button>
          </div>
        </div>
        <div class="faq-time">${currentTime}</div>
      </div>
    </div>
  `;
  scrollToBottom();
}

function renderSubQuestions(category) {
  const currentTime = getTime();
  const sub = faqData[category];
  let buttonsHTML = '';
  sub.forEach(q => {
    buttonsHTML += `<button class="faq-subquestion-button" onclick="showAnswer('${category}', '${q.question}')">${q.question}</button>`;
  });

  dialog.innerHTML += `
    <div class="faq-message assistant">
      <img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble">
          <div class="faq-buttons">${buttonsHTML}</div>
        </div>
        <div class="faq-time">${currentTime}</div>
      </div>
    </div>
  `;
  scrollToBottom();
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("faq-prev")) {
    const category = e.target.dataset.category;
    if (category) renderSubQuestions(category);
  } else if (e.target.classList.contains("faq-top")) {
    renderInitialFAQButtons();
  }
});

function getTime() {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function scrollToBottom() {
  if (!faqBody.querySelector('.faq-scroll-padding')) {
    const spacer = document.createElement('div');
    spacer.className = 'faq-scroll-padding';
    faqBody.appendChild(spacer);
  }
  faqBody.scrollTop = faqBody.scrollHeight;
}


