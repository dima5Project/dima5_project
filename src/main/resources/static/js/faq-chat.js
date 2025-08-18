// static/js/faq-chat.js

let chat = { stomp: null, roomId: null, sub: null };
const GUEST_KEY = "pc_guest_id";

function getGuestId() {
    let gid = localStorage.getItem(GUEST_KEY);
    if (!gid) { gid = (crypto?.randomUUID?.() || String(Math.random()).slice(2)); localStorage.setItem(GUEST_KEY, gid); }
    return gid;
}

async function startChat() {
    try {
        const res = await fetch("/api/chat/room/open", {
            method: "POST",
            headers: { "X-Guest-Id": getGuestId(), "Accept": "application/json" }
        });

        // ① 응답 검증
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const room = await res.json();
        if (!room || !room.id) throw new Error("invalid room payload");

        // ② 상태 세팅
        chat.roomId = room.id;

        // ③ UI/연결
        openChatInputBox();         // 입력창 붙이기
        await loadHistory();        // 이력 로드(시간순으로 뒤집어 렌더)
        connectStomp();             // 실시간 구독 시작
    } catch (e) {
        console.error(e);
        alert("채팅을 시작할 수 없습니다.");
    }
}

async function loadHistory(page = 0, size = 50) {
    const res = await fetch(`/api/chat/room/${chat.roomId}/messages?page=${page}&size=${size}`, {
        headers: { "X-Guest-Id": getGuestId() }
    });
    if (!res.ok) return;
    const list = await res.json();     // 최신 내림차순
    list.reverse().forEach(appendMessage);
    if (typeof scrollToBottom === "function") scrollToBottom();
}

function connectStomp() {
    // 필수 라이브러리 로딩 확인
    if (!window.SockJS || !window.Stomp) {
        alert('채팅 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
        return;
    }

    // 기존 연결 정리 후 재연결
    if (chat.stomp) {
        try { chat.stomp.disconnect(() => { }); } catch { }
    }

    const sock = new SockJS('/ws-chat');
    chat.stomp = Stomp.over(sock);
    chat.stomp.debug = null;

    // ★ 게스트 식별 헤더
    const h = { 'X-Guest-Id': getGuestId() };

    // 연결 + 구독 + 읽음동기화
    chat.stomp.connect(h, () => {
        chat.sub = stomp.subscribe(`/topic/chat.${roomId}`, (frame) => {
            const msg = JSON.parse(frame.body || '{}');
            console.log('[WS]', msg.senderType, msg.sender, msg.content);
            if (msg.type === 'READ_SYNC') return;
            appendBubble?.(msg) || appendMessage?.(msg);
        });

        // ★ 읽음 처리도 같은 헤더로
        chat.stomp.send(`/app/chat.read.${chat.roomId}`, h, "{}");
    });
}

function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const text = ((input && input.value) || "").trim();
    if (!text) return;

    // // 화면에 즉시 반영
    // appendMessage({ content: text, senderType: "USER", createdAt: new Date().toISOString() });
    // if (typeof scrollToBottom === "function") scrollToBottom();
    // if (input) input.value = "";

    // 전송만 하고, 화면 그리기는 서버 브로드캐스트를 받아서 처리
    if (input) input.value = "";

    // ★ 전송 시에도 게스트 헤더 포함
    chat.stomp?.send(
        `/app/chat.send.${chat.roomId}`,
        { 'X-Guest-Id': getGuestId() },
        JSON.stringify({ roomId: chat.roomId, content: text })
    );
}

function openChatInputBox() {
    if (document.getElementById("chatInputBar")) return;
    const bar = document.createElement("div");
    bar.id = "chatInputBar";
    bar.style.cssText = "position:sticky;bottom:0;display:flex;gap:6px;margin-top:8px;background:#f9f9f9;padding-top:6px;";
    bar.innerHTML = `
    <textarea id="chatInput" rows="2" placeholder="상담원에게 메시지를 입력하세요"
      style="flex:1;resize:none;border-radius:10px;padding:8px;border:1px solid #ddd;"></textarea>
    <button id="chatSendBtn" class="faq-subquestion-button" style="width:auto;">보내기</button>
  `;
    const body = document.querySelector(".faq-body");
    if (!body) return;
    body.appendChild(bar);
    document.getElementById("chatSendBtn").addEventListener("click", sendChatMessage);
    document.getElementById("chatInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
    });
}

function resolveWho(m) {
    const t = String(m?.senderType ?? m?.sender_type ?? m?.type ?? '').toUpperCase();
    return t === 'ADMIN' ? 'assistant' : 'user';
}

function appendMessage(m) {
    const who = resolveWho(m);                       // ← 여기!
    const timeText = (m.createdAt || new Date().toISOString()).replace('T', ' ').split('.')[0];
    const safe = (s) => String(s ?? '').replace(/[&<>"']/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[t]));
    const html = `
    <div class="faq-message ${who}">
      ${who === "assistant" ? '<img src="/images/admin_icon.png" alt="admin" class="faq-avatar" />' : ''}
      <div class="faq-bubble-wrapper">
        <div class="faq-bubble"><div>${safe(m.content || '')}</div></div>
        <div class="faq-time">${timeText}</div>
      </div>
    </div>`;
    const dlg = document.getElementById("faq-dialog");
    if (dlg) dlg.insertAdjacentHTML("beforeend", html);
}

// 전역 노출 (onclick에서 사용)
window.startChat = startChat;
window.sendChatMessage = sendChatMessage;
