package net.dima.dima5_project.controller;

import java.nio.file.AccessDeniedException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.ResultSaveDTO;
import net.dima.dima5_project.service.ResultSaveService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/result-save")
@Slf4j
public class ResultSaveApiController {

    private final ResultSaveService resultSaveService;

    /**
     * 저장 API
     * - 프런트가 보낸 ResultSaveDTO를 그대로 받는다.
     * - userId는 로그인 사용자로 덮어쓴다(클라이언트 값은 무시).
     * - 성공 시 { "id": saveSeq } 반환.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> save(@RequestBody ResultSaveDTO dto,
                                                    @AuthenticationPrincipal(expression = "username") String loginUserId) {

        log.info("DEBUG payload: {}", dto);
        
        // 유효성 검증 로직을 `@Valid` 어노테이션과 DTO에서 처리하는 것이 더 좋습니다.
        if (dto.getSearchVsl() == null || dto.getSearchVsl().isBlank())
            throw new IllegalArgumentException("searchVsl is required");
        if (dto.getTop1Port() == null || dto.getTop1Port().isBlank())
            throw new IllegalArgumentException("top1Port is required");
        // top1Pred == 0 && top1Pred != 0 로직은 항상 false이므로 수정
        if (dto.getTop1Pred() == null) 
            throw new IllegalArgumentException("top1Pred is required");
        if (dto.getEta() == null)
            throw new IllegalArgumentException("eta is required");
    
        Long id = resultSaveService.save(dto, loginUserId);
        return ResponseEntity.ok(Map.of("id", id));    
        // dto.setUserId(loginUserId);
    
    }

    /**
     * 삭제 API
     * - 본인 소유 검증 후 삭제.
     * @throws AccessDeniedException 
     */
    @DeleteMapping("/{saveSeq}")
    public ResponseEntity<Void> delete(@PathVariable Long saveSeq,
                                    @AuthenticationPrincipal(expression = "username") String loginUserId) {
        resultSaveService.delete(saveSeq, loginUserId);
        return ResponseEntity.noContent().build();
    }

    
}
