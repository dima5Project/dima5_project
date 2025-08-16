// net.dima.dima5_project.sse.SseEmitters
package net.dima.dima5_project.sse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class SseEmitters {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** 구독 추가(타임아웃 무제한) */
    public SseEmitter add() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        // 연결 종료/타임아웃 시 정리
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        return emitter;
    }

    /** 구독 추가 + 즉시 init 이벤트 전송(프론트에서 연결 확인 용) */
    public SseEmitter addAndInit() {
        SseEmitter e = add();
        // 실패해도 전체에 영향 없도록 try/catch
        try {
            e.send(SseEmitter.event().name("init").data("ok"));
        } catch (IOException ex) {
            // 전송 실패하면 emitter 제거
            emitters.remove(e);
            try {
                e.completeWithError(ex);
            } catch (Exception ignore) {
            }
        }
        return e;
    }

    /** 호환: 기본 이벤트명은 ask-new */
    public void send(Object data) {
        send("ask-new", data);
    }

    /** 커스텀 이벤트명으로 브로드캐스트 */
    public void send(String eventName, Object data) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter e : emitters) {
            if (!safeSend(e, eventName, data)) {
                dead.add(e);
            }
        }
        // 끊어진 연결 일괄 제거
        emitters.removeAll(dead);
    }

    /** 현재 구독자 수 */
    public int size() {
        return emitters.size();
    }

    // ===== 내부 유틸 =====
    private boolean safeSend(SseEmitter e, String eventName, Object data) {
        try {
            e.send(SseEmitter.event().name(eventName).data(data));
            return true;
        } catch (Exception ex) {
            try {
                e.complete();
            } catch (Exception ignore) {
            }
            return false;
        }
    }
}
