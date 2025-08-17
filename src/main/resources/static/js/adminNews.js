
// adminNews.js (전부 교체)

(function () {
    // ===== 공통 =====
    const $ = (id) => document.getElementById(id);
    const tbody = $("newsTbody");
    const emptyEl = $("newsEmpty");
    const toast = $("toast");

    function showToast(msg, ms = 2500) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove("show"), ms);
    }

    async function getJson(url) {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} on ${url}: ${t.slice(0, 200)}`);
        }
        return res.json();
    }

    async function sendJson(method, url, body) {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} on ${url}: ${t.slice(0, 200)}`);
        }
        return res.json().catch(() => ({}));
    }

    // 날짜/표시 유틸
    function toIsoLocal(dtStr) {
        if (!dtStr) return null;
        const d = new Date(dtStr);
        if (isNaN(d)) return null;
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    function fmt(iso) {
        if (!iso) return "";
        return String(iso).replace("T", " ").split(".")[0];
    }
    function escapeHtml(s) {
        return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }
    function escapeAttr(s) { return escapeHtml(s); }

    // ===== 상태 =====
    let page = 0, size = 50, total = 0, totalPages = 0, query = "";

    // ===== 목록 로딩 =====
    async function loadList() {
        const url = `/api/admin/news?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
        const data = await getJson(url);

        const isPage = !!data && typeof data === "object" && Array.isArray(data.content);
        const items = isPage ? data.content : (Array.isArray(data) ? data : []);
        total = isPage ? (data.totalElements ?? items.length) : items.length;
        totalPages = isPage ? (data.totalPages ?? 0) : (items.length ? 1 : 0);

        renderTable(items);
        renderPager();
    }

    // ✅ 선언문(hoisted)으로 유지하세요
    function renderTable(items) {
        tbody.innerHTML = "";
        if (!items.length) {
            emptyEl.hidden = false;
            return;
        }
        emptyEl.hidden = true;

        items.forEach(n => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${n.newsSeq ?? "-"}</td>
        <td class="ellipsis" title="${escapeHtml(n.newsTitle)}">${escapeHtml(n.newsTitle)}</td>
        <td>${escapeHtml(n.publisher)}</td>
        <td>${fmt(n.registerDate)}</td>
        <td>
          ${n.imgUrl ? `<img src="${escapeAttr(n.imgUrl)}" alt="" style="width:90px;height:54px;object-fit:cover;border-radius:6px;" />` : "-"}
        </td>
        <td>
          ${n.newsUrl ? `<a href="${escapeAttr(n.newsUrl)}" target="_blank" rel="noopener">열기</a>` : "-"}
        </td>
        <td>
          <button class="adm-btn adm-btn--ghost btn-edit" data-id="${n.newsSeq}">수정</button>
          <button class="adm-btn adm-btn--ghost btn-del" data-id="${n.newsSeq}">삭제</button>
        </td>`;
            tbody.appendChild(tr);
        });
    }

    function renderPager() {
        const pager = $("pager"), info = $("pageInfo"), prev = $("prevPage"), next = $("nextPage");
        if (!total && page === 0) { pager.hidden = true; return; }
        pager.hidden = false;

        info.textContent = totalPages ? `페이지 ${page + 1} / ${totalPages}` : `페이지 ${page + 1}`;
        prev.disabled = page <= 0;
        next.disabled = totalPages ? (page + 1 >= totalPages) : (total < size);

        prev.onclick = () => { if (page > 0) { page--; loadList().catch(console.error); } };
        next.onclick = () => { if (!next.disabled) { page++; loadList().catch(console.error); } };
    }

    // ===== 모달/CRUD =====
    const modal = $("newsModal");
    const form = $("newsForm");
    const modalTitle = $("modalTitle");
    const f = {
        newsSeq: $("newsSeq"),
        newsTitle: $("newsTitle"),
        publisher: $("publisher"),
        registerDate: $("registerDate"),
        imgUrl: $("imgUrl"),
        newsUrl: $("newsUrl"),
    };

    $("btnOpenCreate").addEventListener("click", openCreate);
    $("btnSearch").addEventListener("click", () => { page = 0; query = $("q").value.trim(); loadList().catch(console.error); });
    $("q").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); $("btnSearch").click(); }
    });

    tbody.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const id = btn.getAttribute("data-id");

        if (btn.classList.contains("btn-edit")) {
            const tr = btn.closest("tr");
            openEdit({
                newsSeq: Number(id),
                newsTitle: tr.children[1].title || tr.children[1].textContent.trim(),
                publisher: tr.children[2].textContent.trim(),
                registerDate: tr.children[3].textContent.trim().replace(" ", "T"),
                imgUrl: tr.querySelector("img")?.getAttribute("src") || "",
                newsUrl: tr.children[5].querySelector("a")?.getAttribute("href") || "",
            });
        }
        if (btn.classList.contains("btn-del")) {
            if (!confirm("삭제하시겠습니까?")) return;
            sendJson("DELETE", `/api/admin/news/${id}`).then(() => {
                showToast("삭제되었습니다.");
                loadList().catch(console.error);
            }).catch(err => { console.error(err); alert("삭제 실패"); });
        }
    });

    function openCreate() {
        modalTitle.textContent = "뉴스 등록";
        form.reset();
        f.newsSeq.value = "";
        const now = new Date();
        f.registerDate.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        modal.showModal();
    }

    function openEdit(item) {
        modalTitle.textContent = "뉴스 수정";
        form.reset();
        f.newsSeq.value = item.newsSeq ?? "";
        f.newsTitle.value = item.newsTitle ?? "";
        f.publisher.value = item.publisher ?? "";
        if (item.registerDate) {
            const d = new Date(item.registerDate.replace(" ", "T"));
            if (!isNaN(d)) f.registerDate.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
        f.imgUrl.value = item.imgUrl ?? "";
        f.newsUrl.value = item.newsUrl ?? "";
        modal.showModal();
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const payload = {
            newsTitle: f.newsTitle.value.trim(),
            publisher: f.publisher.value.trim(),
            registerDate: toIsoLocal(f.registerDate.value) || null,
            imgUrl: f.imgUrl.value.trim() || null,
            newsUrl: f.newsUrl.value.trim() || null,
        };
        if (!payload.newsTitle || !payload.publisher) { alert("제목과 매체는 필수입니다."); return; }

        const id = f.newsSeq.value;
        const req = id ? sendJson("PUT", `/api/admin/news/${id}`, payload) : sendJson("POST", "/api/admin/news", payload);

        req.then(() => {
            showToast(id ? "수정되었습니다." : "등록되었습니다.");
            modal.close();
            loadList().catch(console.error);
        }).catch(err => { console.error(err); alert("저장 실패"); });
    });

    modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.close(); });

    // ===== 초기 로드 =====
    document.addEventListener("DOMContentLoaded", () => { loadList().catch(console.error); });
})();

