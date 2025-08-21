// ===== faq-chat.js (최종) =====

// 전역 상태
let chat = { stomp: null, roomId: null, sub: null, ended: false };
/* =======================
   0) 옵션 (원하는 값으로 바꿔쓰세요)
======================= */
const CHAT_OPTS = {
    // 자동 스크롤: "거의 맨 아래"로 판정할 여유 px
    autoScrollThreshold: 120,

    // 새 메시지 토스트 사용 여부 + 문구
    unreadToast: true,
    unreadToastText: n => `새 메시지 ${n}개`,

    // 환영 안내 말풍선 노출 여부 + HTML
    showWelcomeNotice: true,
    welcomeHTML: `
    <div class="faq-text">상담원 연결 중입니다. 채팅을 남겨주세요.</div>
    <div class="faq-buttons"><button id="endChatBtn" type="button" class="faq-subquestion-button">대화 종료</button></div>
  `,

    // 개행 보존 방법: true면 \n → <br>, false면 그대로
    newlineAsBr: true,

    // 입력 전송 키
    //  - sendOnEnter: Enter로 전송
    //  - ctrlEnterToSend: false면 Ctrl/Cmd+Enter는 무시 (true면 그것도 전송)
    sendOnEnter: true,
    ctrlEnterToSend: true,

    // 불러올 이력 개수
    historyPageSize: 100,
};
// --- escaping & formatting ---
function esc(s = '') {
    return String(s).replace(/[&<>"']/g, t => (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[t])
    ));
}

// 메시지 텍스트를 HTML로 변환: \n → <br>, **bold** 지원
function formatContent(text) {
    let html = esc(text || '');

    // 줄바꿈
    if (CHAT_OPTS.newlineAsBr) {
        html = html.replace(/\r?\n/g, '<br>');
    }

    // **굵게**
    html = html.replace(/\*\*([^*\n][^*]*?)\*\*/g, '<strong>$1</strong>');

    return html;
}

// 런타임에서 바꾸고 싶을 때:
// setFaqChatOptions({ sendOnEnter:false, autoScrollThreshold:80 })
window.setFaqChatOptions = (opts = {}) => Object.assign(CHAT_OPTS, opts);
window.getFaqChatConfig = () => ({ ...CHAT_OPTS });

/* =======================
   Auto-scroll helpers
======================= */

// .faq-log 엘리먼트
function getLogEl() {
    return document.getElementById('faq-dialog') || document.querySelector('#faq-box .faq-log');
}

// '아래쪽에 거의 와 있는 상태'인지 판단
function isNearBottom(el, threshold = CHAT_OPTS.autoScrollThreshold) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

// '최신으로' 버튼 보장/제어
// function ensureToBottomBtn() {
//     let btn = document.getElementById('faq-to-bottom');
//     const log = getLogEl();
//     if (!btn && log) {
//         btn = document.createElement('button');
//         btn.id = 'faq-to-bottom';
//         btn.type = 'button';
//         btn.textContent = '최신으로';
//         log.appendChild(btn);
//         btn.addEventListener('click', () => {
//             scrollToBottom();
//             hideToBottomBtn();
//         });
//     }
//     return btn;
// }

// 새 메시지 토스트
let __unread = 0;

function ensureNewMsgToast() {
    let el = document.getElementById('faq-new-msg');
    const log = getLogEl();
    if (!el && log) {
        el = document.createElement('button');
        el.id = 'faq-new-msg';
        el.type = 'button';
        el.textContent = '새 메시지';
        log.appendChild(el);
        el.addEventListener('click', () => {
            __unread = 0;
            updateNewMsgToast();
            scrollToBottom();
        });
    }
    return el;
}

function updateNewMsgToast() {
    const el = ensureNewMsgToast();
    if (!el) return;
    if (__unread > 0) {
        el.textContent = `새 메시지 ${__unread}개`;
        el.style.display = 'inline-flex';
    } else {
        el.style.display = 'none';
    }
}


// 스크롤 맨 아래
function scrollToBottom() {
    const log = getLogEl();
    if (log) log.scrollTop = log.scrollHeight;
}

/** 게스트 식별자 (localStorage에 1회 저장) */
function getGuestId() {
    const KEY = "pc_guest_id";
    try {
        let id = localStorage.getItem(KEY);
        if (!id || typeof id !== "string") {
            id = "g-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
            localStorage.setItem(KEY, id);
        }
        return id;
    } catch {
        return "g-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
}

/** 사용자 화면용 좌/우 정렬 (USER=오른쪽, ADMIN=왼쪽) */
function sideForUser(m) {
    const t = String(m?.senderType || m?.sender_type || m?.type || "").toUpperCase();
    return t === "USER" ? "user" : "assistant";
}

/** (추가) 시스템 안내 말풍선 렌더러 */
function appendSystemNotice(htmlInner, withTime = true) {
    const timeText = new Date().toISOString().replace("T", " ").split(".")[0];
    const html = `
    <div class="faq-message assistant nav-type">
      <img src="/images/admin-icon.png" alt="admin" class="faq-avatar" />
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble" style="max-width:300px;">${htmlInner}</div>
      </div>
    </div>`;
    const dlg = document.getElementById("faq-dialog");
    if (dlg) dlg.insertAdjacentHTML("beforeend", html);
    scrollToBottom();
}

/** 말풍선 렌더 */
function appendMessage(m) {
    const log = getLogEl();
    const who = sideForUser(m);
    const wasNearBottom = isNearBottom(log);   // ★ 추가: 기존 위치가 하단 근처인지

    const html = `
    <div class="faq-message ${who}">
      ${who === "assistant" ? '<img src="/images/admin-icon.png" alt="admin" class="faq-avatar" />' : ""}
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble" style="max-width:300px;"><div>${formatContent(m.content || "")}</div></div>
      </div>
    </div>`;

    if (log) {
        log.insertAdjacentHTML("beforeend", html);

        // 하단에 거의 있었거나 '내가 보낸 메시지'면 자동 스크롤
        if (wasNearBottom || who === 'user') {
            scrollToBottom();
            __unread = 0;
            if (CHAT_OPTS.unreadToast) updateNewMsgToast();

        } else {
            __unread++;
            updateNewMsgToast();
            if (CHAT_OPTS.unreadToast) { __unread++; updateNewMsgToast(); }
        }
    }
}

/** 이력 불러오기 (최신 내림차순 → 오래된 것부터 출력) */
async function loadHistory(page = 0, size = 50) {
    if (!chat.roomId) return;
    const res = await fetch(`/api/chat/room/${chat.roomId}/messages?page=${page}&size=${size}`, {
        headers: { "X-Guest-Id": getGuestId() },
    });
    if (!res.ok) return;
    const list = await res.json();
    list.reverse().forEach(appendMessage);
}

/** STOMP 연결/구독 */
function connectStomp() {
    if (!window.SockJS || !window.Stomp) {
        console.error("[faq-chat] SockJS/STOMP not loaded");
        alert("채팅 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
        return;
    }
    if (!chat.roomId || chat.ended) return;

    // 기존 연결 정리
    try { chat.sub?.unsubscribe(); } catch { }
    chat.sub = null;
    try { chat.stomp?.disconnect(() => { }); } catch { }
    chat.stomp = null;

    const sock = new SockJS("/ws-chat");
    chat.stomp = Stomp.over(sock);
    chat.stomp.debug = null;

    const headers = { "X-Guest-Id": getGuestId() };

    chat.stomp.connect(headers, () => {
        if (chat.ended) return; // 종료 중 재연결 방지
        // 방 토픽 구독
        chat.sub = chat.stomp.subscribe(`/topic/chat.${chat.roomId}`, (frame) => {
            const body = JSON.parse(frame.body || "{}");
            if (body.type === "READ_SYNC") return;
            appendMessage(body);
        });

        // 읽음 동기화
        chat.stomp.send(`/app/chat.read.${chat.roomId}`, headers, "{}");
    });
}

/** (추가) 종료 처리 */
function endChat() {
    if (chat.ended) return;
    chat.ended = true;

    // 입력 막기
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");
    if (input) { input.disabled = true; input.placeholder = "대화가 종료되었습니다."; }
    if (sendBtn) sendBtn.disabled = true;

    // STOMP 정리
    try { chat.sub?.unsubscribe(); } catch { }
    chat.sub = null;
    try { chat.stomp?.disconnect(() => { }); } catch { }
    chat.stomp = null;

    // 종료 안내
    appendSystemNotice(`
    <div class="faq-text">대화가 종료되었습니다. 상담을 더 원하시면 다시 <b>1:1 채팅</b>을 눌러주세요.</div>
  `);
}

/** (추가) 안내 + '대화 종료' 버튼 표시 */
function showWelcomeAndEndButton() {
    const htmlInner = `
    <div class="faq-text">상담원 연결 중입니다. 채팅을 남겨주세요.</div>
    <div class="faq-buttons">
      <button id="endChatBtn" type="button" class="faq-subquestion-button">대화 종료</button>
    </div>`;
    appendSystemNotice(htmlInner);
    const btn = document.getElementById("endChatBtn");
    if (btn) btn.onclick = endChat;
}

/** 메시지 전송 (서버 에코만 렌더 → 중복 방지) */
function sendChatMessage() {
    if (chat.ended) return; // 종료 후 전송 금지
    const input = document.getElementById("chatInput");
    const text = (input && input.value || "").trim();
    if (!text || !chat.roomId || !chat.stomp) return;

    input.value = "";

    chat.stomp.send(
        `/app/chat.send.${chat.roomId}`,
        { "X-Guest-Id": getGuestId() },
        JSON.stringify({ roomId: chat.roomId, content: text })
    );

    scrollToBottom();
    __unread = 0;
    updateNewMsgToast();
}

/** 입력바가 없으면 자동 생성, 있으면 그대로 사용 */
function ensureComposer() {
    let input = document.getElementById("chatInput");
    let sendBtn = document.getElementById("chatSend");

    if (!input || !sendBtn) {
        // 동적 주입(기존 마크업에 composer가 없다면)
        if (!document.getElementById("chatInputBar")) {
            const bar = document.createElement("div");
            bar.id = "chatInputBar";
            bar.className = "faq-composer";
            bar.innerHTML = `
        <textarea id="chatInput" rows="2" placeholder="상담원에게 메시지를 입력하세요"></textarea>
        <button id="chatSend" type="button" class="faq-subquestion-button">보내기</button>`;
            const parent =
                document.querySelector('#faq-widget .faq-panel')
                || document.querySelector("#faq-box .faq-body")
                || document.querySelector(".faq-body");
            if (parent) parent.appendChild(bar);
        }
        input = document.getElementById("chatInput");
        sendBtn = document.getElementById("chatSend");
    }

    // 종료 상태라면 비활성
    if (chat.ended) {
        if (input) { input.disabled = true; input.placeholder = "대화가 종료되었습니다."; }
        if (sendBtn) sendBtn.disabled = true;
    } else {
        if (input) { input.disabled = false; input.placeholder = "상담원에게 메시지를 입력하세요"; }
        if (sendBtn) sendBtn.disabled = false;
    }

    // 이벤트 중복 방지 후 바인딩
    if (sendBtn) {
        sendBtn.removeEventListener("click", sendChatMessage);
        sendBtn.addEventListener("click", sendChatMessage);
    }
    // Enter 키 핸들러 — 한 번만 바인딩
    if (input) {
        const onKey = (e) => {
            if (e.key !== 'Enter') return;
            const ctrlOrCmd = e.ctrlKey || e.metaKey;
            const { sendOnEnter, ctrlEnterToSend } = CHAT_OPTS;
            if (sendOnEnter) {
                // Enter 전송 / Shift+Enter 줄바꿈
                if (!e.shiftKey && !ctrlOrCmd) { e.preventDefault(); sendChatMessage(); }
                else if (ctrlOrCmd && ctrlEnterToSend) { e.preventDefault(); sendChatMessage(); }
            } else {
                // Enter 줄바꿈, Ctrl/Cmd+Enter 전송
                if (ctrlOrCmd) { e.preventDefault(); sendChatMessage(); }
            }
        };
        if (input.__faqEnterHandler) input.removeEventListener('keydown', input.__faqEnterHandler);
        input.__faqEnterHandler = onKey;
        input.addEventListener('keydown', onKey);
    }
}

/** 방 열기 → roomId 설정 → 입력바 보장 → 이력 로드 → 안내 → STOMP 연결 */
async function startChat() {
    chat.ended = false; // 새 세션 시작
    __unread = 0;
    const res = await fetch("/api/chat/room/open", {
        method: "POST",
        headers: { "X-Guest-Id": getGuestId(), "Accept": "application/json" },
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`room open failed: ${res.status}\n${txt}`);
        return;
    }
    const room = await res.json();
    chat.roomId = room.id;

    ensureComposer();
    await loadHistory(0, CHAT_OPTS.historyPageSiz);

    // 히스토리 아래에 안내 + 종료버튼
    if (CHAT_OPTS.showWelcomeNotice) showWelcomeAndEndButton()

    // 연결
    connectStomp();
    // 새 메시지 토스트 준비 + 스크롤 상태에 따라 자동 토글
    if (CHAT_OPTS.unreadToast) ensureNewMsgToast();
    const log = getLogEl();
    if (log) {
        if (log.__scrollHandler) log.removeEventListener('scroll', log.__scrollHandler);
        log.__scrollHandler = () => {
            if (CHAT_OPTS.unreadToast && isNearBottom(log)) { __unread = 0; updateNewMsgToast(); }
        };
        log.addEventListener('scroll', log.__scrollHandler);
    }
}

// 전역 노출
window.startChat = startChat;
window.sendChatMessage = sendChatMessage;
