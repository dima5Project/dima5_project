// /static/js/admin-chat.js
(() => {
    // --- 의존성 가드 ---
    if (!window.SockJS || !window.Stomp) {
        console.error('[admin-chat] SockJS/STOMP not loaded');
        alert('채팅 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
        return;
    }

    // --- 상태 ---
    const chat = { stomp: null, sub: null, roomId: null };
    let rooms = [];
    let refreshTimer = null;

    // --- DOM ---
    const $ = (s) => document.querySelector(s);
    const roomList = $('#roomList');
    const chatLog = $('#chatLog');
    const adminMsg = $('#adminMsg');
    const adminSend = $('#adminSend');
    const chatPanel = $('#chatPanel');
    const chatOverlay = $('#chatOverlay');
    const chatRefresh = $('#chatRefresh');
    const chatClose = $('#chatClose');
    const btnCloseRoom = $('#btnCloseRoom');
    const roomTitle = $('#roomTitle');
    const roomMiniTitle = $('#roomMiniTitle');
    const navChatBtn = $('#navChatBtn');           // 사이드바 버튼

    // 사이드바 “상담 채팅” 빨간 점 (미읽음 표시)
    const chatDot = (() => {
        if (!navChatBtn) return null;
        let el = document.querySelector('#chatNoticeDot');
        if (!el) {
            el = document.createElement('span');
            el.id = 'chatNoticeDot';
            el.className = 'adm-dot';
            navChatBtn.style.position ||= 'relative';   // 점이 보이도록
            navChatBtn.appendChild(el);
        }
        return el;
    })();
    const setChatDot = (on) => {
        if (!chatDot) return;
        chatDot.classList.toggle('show', !!on);
        chatDot.style.display = on ? 'inline-block' : 'none';
    };

    // --- 유틸 ---
    const safe = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (t) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[t]));

    const fmt = (iso) => {
        if (!iso) return '-';
        const d = new Date(String(iso).replace(' ', 'T'));
        if (isNaN(d)) return '-';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const enableInput = (on) => { adminMsg.disabled = adminSend.disabled = !on; };
    const setMiniTitle = (t) => { if (roomMiniTitle) roomMiniTitle.value = t || '-'; };
    setMiniTitle('-'); // 초기

    // 관리자 화면 정렬 규칙:
    //  - ADMIN(내가 보낸 메시지): 오른쪽(= user)
    //  - USER/게스트: 왼쪽(= assistant)
    const sideForAdminView = (m) => {
        const t = String(m?.senderType ?? m?.sender_type ?? m?.type ?? '').toUpperCase();
        return t === 'ADMIN' ? 'user' : 'assistant';
    };

    function appendBubble(m) {
        const who = sideForAdminView(m);
        const timeText = (m.createdAt || new Date().toISOString()).replace('T', ' ').split('.')[0];
        const avatar = (who === 'assistant')
            ? '<img src="/images/lang_icon.png" alt="user" class="faq-avatar" />'
            : '';
        const html = `
      <div class="faq-message ${who}">
        ${avatar}
        <div class="faq-bubble-wrapper">
          <div class="faq-bubble" style="max-width:360px;">
            <div>${safe(m.content || '')}</div>
          </div>
          <div class="faq-time">${timeText}</div>
        </div>
      </div>`;
        chatLog.insertAdjacentHTML('beforeend', html);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    async function loadHistory(roomId, page = 0, size = 100) {
        const res = await fetch(`/api/chat/room/${roomId}/messages?page=${page}&size=${size}`);
        if (!res.ok) return;
        const list = await res.json();      // 최신 내림차순
        chatLog.innerHTML = '';
        list.reverse().forEach(appendBubble);     // 오래된 것부터 렌더
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // --- STOMP ---
    function ensureStomp() {
        if (chat.stomp) return chat.stomp;
        const sock = new SockJS('/ws-chat');
        chat.stomp = Stomp.over(sock);
        chat.stomp.debug = null;
        return chat.stomp;
    }

    function subscribeRoom(roomId) {
        const stomp = ensureStomp();
        const go = () => {
            if (chat.sub) { try { chat.sub.unsubscribe(); } catch { } chat.sub = null; }
            chat.sub = stomp.subscribe(`/topic/chat.${roomId}`, (frame) => {
                const body = JSON.parse(frame.body || '{}');
                if (body.type === 'READ_SYNC') return;
                appendBubble(body);
            });
            // 읽음 동기화
            stomp.send(`/app/chat.read.${roomId}`, {}, "{}");
        };
        if (!stomp.connected) stomp.connect({}, go);
        else go();
    }

    // --- 방 목록 ---
    async function fetchRooms() {
        const [open, assigned] = await Promise.all([
            fetch('/api/chat/admin/rooms?status=OPEN&limit=200').then(r => r.json()),
            fetch('/api/chat/admin/rooms?status=ASSIGNED&limit=200').then(r => r.json())
        ]);
        const all = [...open, ...assigned];
        all.sort((a, b) => (a.lastMsgAt < b.lastMsgAt ? 1 : -1)); // 최근 먼저
        rooms = all;
    }

    function renderRooms() {
        roomList.innerHTML = '';
        if (!rooms.length) {
            roomList.innerHTML = '<div class="adm-room-empty">대기 중인 방이 없습니다.</div>';
            return;
        }
        rooms.forEach(r => {
            const active = String(r.id) === String(chat.roomId);
            const label = r.label || r.roomLabel || r.userId || (r.guestId ? `GUEST:${r.guestId}` : `Room #${r.id}`);
            roomList.insertAdjacentHTML('beforeend', `
        <button class="adm-room-item ${active ? 'is-active' : ''}" data-room="${r.id}">
          <div class="adm-room-topline">
            <span class="adm-room-label">${safe(label)}</span>
            ${r.unread > 0 ? `<span class="adm-badge">${r.unread}</span>` : ''}
          </div>
          <div class="adm-room-prev">${safe(r.preview || '')}</div>
          <div class="adm-room-time">${fmt(r.lastMsgAt)}</div>
        </button>
      `);
        });
    }

    async function refreshRooms() {
        await fetchRooms().catch(() => { });
        renderRooms();
        // 총 미확인 → 사이드바 빨간 점
        const totalUnread = rooms.reduce((sum, r) => sum + (Number(r.unread) || 0), 0);
        setChatDot(totalUnread > 0);
    }

    // --- 방 열기/배정 ---
    async function openRoom(roomId) {
        chat.roomId = roomId;
        renderRooms();

        await fetch(`/api/chat/admin/rooms/${roomId}/assign`, { method: 'POST' }).catch(() => { });
        await loadHistory(roomId);
        subscribeRoom(roomId);
        enableInput(true);
        btnCloseRoom.disabled = false;

        const item = rooms.find(r => String(r.id) === String(roomId)) || {};
        const label = item.label || item.roomLabel || item.userId ||
            (item.guestId ? `GUEST:${item.guestId}` : '') ||
            `Room #${roomId}`;
        roomTitle.textContent = `${label} (#${roomId})`;
        setMiniTitle(label);

        // 읽음 반영 후 목록/뱃지 갱신
        refreshRooms().catch(() => { });
    }

    // --- 전송/종료 ---
    function sendMsg() {
        const text = (adminMsg.value || '').trim();
        if (!text || !chat.roomId) return;
        // 낙관 렌더링 X (서버 에코만 렌더 → 중복 방지)
        adminMsg.value = '';
        chat.stomp?.send(
            `/app/chat.send.${chat.roomId}`,
            {},
            JSON.stringify({ roomId: chat.roomId, content: text })
        );
    }

    async function closeRoom() {
        if (!chat.roomId) return;
        await fetch(`/api/chat/admin/rooms/${chat.roomId}/close`, { method: 'POST' }).catch(() => { });
        chat.roomId = null;
        chatLog.innerHTML = '';
        roomTitle.textContent = '방을 선택하세요';
        setMiniTitle('-');
        enableInput(false);
        btnCloseRoom.disabled = true;
        await refreshRooms();
    }

    // --- 패널 열고 닫기 ---
    function openPanel(e) {
        e?.preventDefault?.();
        chatPanel?.classList.add('open');
        chatOverlay?.classList.add('show');
        document.body.classList.add('no-scroll');
        refreshRooms().catch(console.error);
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(refreshRooms, 8000);
    }
    function closePanel() {
        chatPanel?.classList.remove('open');
        chatOverlay?.classList.remove('show');
        document.body.classList.remove('no-scroll');
        setMiniTitle('-');
        if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    }

    // --- 이벤트 바인딩 ---
    navChatBtn?.addEventListener('click', openPanel);
    chatClose?.addEventListener('click', closePanel);
    chatOverlay?.addEventListener('click', closePanel);
    chatRefresh?.addEventListener('click', () => refreshRooms().catch(() => { }));
    btnCloseRoom?.addEventListener('click', closeRoom);
    adminSend?.addEventListener('click', sendMsg);
    adminMsg?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    roomList?.addEventListener('click', (e) => {
        const btn = e.target.closest('.adm-room-item');
        if (!btn) return;
        openRoom(btn.dataset.room);
    });

    // --- 초기화 ---
    enableInput(false);
    // 페이지 로드시 항상 "닫힌 상태"로 보정
    document.addEventListener('DOMContentLoaded', () => {
        chatPanel?.classList.remove('open');
        chatOverlay?.classList.remove('show');
        document.body.classList.remove('no-scroll');
    });

    // 외부 제어용 (원하면 사용)
    window.AdminChat = { open: openPanel, close: closePanel };
})();
