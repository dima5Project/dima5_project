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

    // 연결된 모든 SSE 클라이언트를 저장
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * 클라이언트 연결 추가
     */
    public SseEmitter add() {
        // 0L = 타임아웃 없음
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        return emitter;
    }

    /**
     * 모든 클라이언트에 데이터 전송
     */
    public void send(Object data) {
        List<SseEmitter> deadEmitters = new ArrayList<>();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("ask-new") // 이벤트 이름
                        .data(data)); // 전송할 데이터
            } catch (IOException e) {
                // 전송 실패 시 제거 목록에 추가
                deadEmitters.add(emitter);
            }
        });

        emitters.removeAll(deadEmitters);
    }

    /**
     * 현재 연결된 클라이언트 수
     */
    public int size() {
        return emitters.size();
    }
}
