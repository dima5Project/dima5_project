package net.dima.dima5_project.service;

import java.nio.file.AccessDeniedException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.ResultSaveDTO;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.entity.ResultSaveEntity;
import net.dima.dima5_project.repository.PredictUserRepository;
import net.dima.dima5_project.repository.ResultSaveRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResultSaveService {
    
    private final ResultSaveRepository resultSaveRepository;
    private final PredictUserRepository predictUserRepository;

    /**
     * 예측 결과 저장
     * @param dto
     * @param loginUserId
     * @return
     */
    @Transactional
    public Long save(ResultSaveDTO dto, String loginUserId) {
        PredictUserEntity user = predictUserRepository.findByUserId(loginUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + loginUserId));

        // DTO에서 값이 없는 필드에 기본값 설정
        String searchVsl = (dto.getSearchVsl() == null || dto.getSearchVsl().isBlank()) ? "없음" : dto.getSearchVsl();
        String top1Port = (dto.getTop1Port() == null || dto.getTop1Port().isBlank()) ? "없음" : dto.getTop1Port();
        Double top1Pred = (dto.getTop1Pred() == null) ? 0.0 : dto.getTop1Pred();


        ResultSaveEntity entity = ResultSaveEntity.builder()
            .searchVsl(dto.getSearchVsl())
            .userId(user)
            .lat(dto.getLat())
            .lon(dto.getLon())
            .top1Port(dto.getTop1Port())
            .top1Pred(dto.getTop1Pred())
            .eta(dto.getEta())
            .build();

        log.info("수신된 DTO 데이터: {}", dto);
            
        return resultSaveRepository.save(entity).getSaveSeq();
    }

    /**
     * 저장 이력 삭제
     * - 현재 로그인 사용자의 소유인지 먼저 검증
     * @param saveSeq           삭제할 행 PK
     * @param currentUserId     로그인 사용자 ID
     * @throws AccessDeniedException 
     */
    @Transactional
    public void delete(Long saveSeq, String currentUserId) {
        boolean owned = resultSaveRepository.existsBySaveSeqAndUserId_UserId(saveSeq, currentUserId);
        if (!owned) {
            throw new org.springframework.security.access.AccessDeniedException("삭제 권한이 없습니다.");
        }
            resultSaveRepository.deleteById(saveSeq);
    }


    /**
     * 마이페이지 목록을 페이징으로 가져옴
     * - 기본 최신순으로 조회
     * @param currentUserId     로그인 사용자 ID
     * @param pageable          페이지 / 사이즈 / 정렬 정보
     * @return                  페이징 결과
     */
    @Transactional(readOnly = true)
    public Page<ResultSaveEntity> getMyPage(String currentUserId, Pageable pageable) {
        // @EntityGraph로 N+1 방지된 메서드 사용
        return resultSaveRepository.findByUserId_UserIdOrderBySaveSeqDesc(currentUserId, pageable);
    }

}
