// /js/askreply.js
document.addEventListener("DOMContentLoaded", () => {
    const askSeq = window.__ASK_SEQ__;
    if (askSeq == null) {
        alert("잘못된 접근입니다. (문의 번호 없음)");
        return;
    }

    const $ = (id) => document.getElementById(id);
    const titleEl = $("askTitle");
    const metaEl = $("askMeta");
    const contentEl = $("askContent");
    const replyTextarea = $("replyContent");
    const saveBtn = $("saveReply");
    const deleteBtn = $("deleteReply");
    const replyBadge = $("replyBadge");
    const replyInfo = $("replyInfo");

    const fmt = (iso) => (iso ? String(iso).replace("T", " ").split(".")[0] : "");

    function markAnswered(replyDateIso) {
        replyBadge.style.display = "inline-block";
        replyInfo.textContent = `답변 작성일: ${fmt(replyDateIso)}`;
        deleteBtn.style.display = "inline-block";
    }

    function markUnanswered() {
        replyBadge.style.display = "none";
        replyInfo.textContent = "";
        deleteBtn.style.display = "none";
    }

    // ===== 상세 로드 =====
    fetch(`/api/admin/asks/${askSeq}`, { headers: { Accept: "application/json" } })
        .then(async (res) => {
            if (res.status === 404) {
                alert("해당 문의를 찾을 수 없습니다.");
                location.href = "/admin";
                throw new Error("404");
            }
            if (res.status === 401) {
                alert("로그인이 필요합니다.");
                location.href = "/login";
                throw new Error("401");
            }
            if (res.status === 403) {
                alert("권한이 없습니다.");
                throw new Error("403");
            }
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`상세 조회 실패: HTTP ${res.status} ${txt.slice(0, 120)}`);
            }
            return res.json();
        })
        .then((data) => {
            titleEl.textContent = data.title ?? "";
            metaEl.textContent = `${data.writer ?? ""} · ${fmt(data.createdAt)}`;
            contentEl.textContent = data.content ?? "";

            if (data.reply) {
                replyTextarea.value = data.reply.content ?? "";
                // createdAt 또는 replyDate 둘 다 지원
                markAnswered(data.reply.createdAt || data.reply.replyDate);
            } else {
                markUnanswered();
            }
        })
        .catch((e) => {
            if (!["404", "401", "403"].includes(e.message)) {
                console.error(e);
                alert("상세 조회에 실패했습니다.");
            }
        });

    // ===== 저장 (더블클릭 방지/에러 분기) =====
    let busy = false;
    saveBtn.addEventListener("click", async () => {
        if (busy) return;

        const reply = replyTextarea.value.trim();
        if (!reply) {
            alert("답변을 입력해주세요.");
            return;
        }

        busy = true;
        saveBtn.disabled = true;

        try {
            const res = await fetch(`/api/admin/asks/${askSeq}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ replyContent: reply }) // DTO 필드명과 일치
            });

            if (res.status === 401) {
                alert("로그인이 필요합니다.");
                location.href = "/login";
                return;
            }
            if (res.status === 403) {
                alert("권한이 없습니다.");
                return;
            }
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`저장 실패: HTTP ${res.status} ${txt.slice(0, 200)}`);
            }

            // 응답 사용해 화면 즉시 갱신
            const data = await res.json().catch(() => ({}));
            const replyDto = data.reply || {};
            const replyDate = replyDto.replyDate || replyDto.createdAt || new Date().toISOString();
            markAnswered(replyDate);

            // 알림
            if (window.toast) window.toast("저장되었습니다.");
            else alert("저장되었습니다.");
        } catch (e) {
            console.error(e);
            alert("저장에 실패했습니다.");
        } finally {
            busy = false;
            saveBtn.disabled = false;
        }
    });

    // ===== 삭제 =====
    deleteBtn.addEventListener("click", async () => {
        if (!confirm("정말 답변을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/admin/asks/${askSeq}/reply`, {
                method: "DELETE",
                headers: { Accept: "application/json" }
            });

            if (res.status === 401) {
                alert("로그인이 필요합니다.");
                location.href = "/login";
                return;
            }
            if (res.status === 403) {
                alert("권한이 없습니다.");
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            replyTextarea.value = "";
            markUnanswered();

            if (window.toast) window.toast("답변이 삭제되었습니다.");
            else alert("답변이 삭제되었습니다.");
        } catch (e) {
            console.error(e);
            alert("삭제 실패");
        }
    });

    // 편의: Ctrl/Cmd + S 로 저장
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            saveBtn.click();
        }
    });
});
