// ===== faq-chat.js (최종) =====

// 전역 상태
let chat = { stomp: null, roomId: null, sub: null };

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

/** 대화영역 스크롤 맨 아래로 */
function scrollToBottom() {
    const body = document.querySelector("#faq-box .faq-body") || document.querySelector(".faq-body");
    if (body) body.scrollTop = body.scrollHeight;
}

/** 말풍선 렌더 */
function appendMessage(m) {
    const who = sideForUser(m);
    const timeText = (m.createdAt || new Date().toISOString()).replace("T", " ").split(".")[0];
    const esc = s =>
        String(s ?? "").replace(/[&<>"']/g, t => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[t]));
    const html = `
    <div class="faq-message ${who}">
      ${who === "assistant" ? '<img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />' : ""}
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble" style="max-width:300px;"><div>${esc(m.content || "")}</div></div>
        <div class="faq-time">${timeText}</div>
      </div>
    </div>`;
    const dlg = document.getElementById("faq-dialog");
    if (dlg) dlg.insertAdjacentHTML("beforeend", html);
    scrollToBottom();
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
    // 의존성 가드
    if (!window.SockJS || !window.Stomp) {
        console.error("[faq-chat] SockJS/STOMP not loaded");
        alert("채팅 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
        return;
    }
    if (!chat.roomId) return;

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

/** 메시지 전송 (서버 에코만 렌더 → 중복 방지) */
function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const text = (input && input.value || "").trim();
    if (!text || !chat.roomId || !chat.stomp) return;

    input.value = "";

    chat.stomp.send(
        `/app/chat.send.${chat.roomId}`,
        { "X-Guest-Id": getGuestId() },
        JSON.stringify({ roomId: chat.roomId, content: text })
    );
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
            const body = document.querySelector("#faq-box .faq-body") || document.querySelector(".faq-body");
            if (body) body.appendChild(bar);
        }
        input = document.getElementById("chatInput");
        sendBtn = document.getElementById("chatSend");
    }

    // 이벤트 중복 방지 후 바인딩
    if (sendBtn) {
        sendBtn.removeEventListener("click", sendChatMessage);
        sendBtn.addEventListener("click", sendChatMessage);
    }
    if (input) {
        input.removeEventListener("keydown", handleEnterToSend);
        input.addEventListener("keydown", handleEnterToSend);
    }

    function handleEnterToSend(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    }
}

/** 방 열기 → roomId 설정 → 입력바 보장 → 이력 로드 → STOMP 연결 */
async function startChat() {
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
    await loadHistory(0, 100);
    connectStomp();
}

// 전역 노출
window.startChat = startChat;
window.sendChatMessage = sendChatMessage;
