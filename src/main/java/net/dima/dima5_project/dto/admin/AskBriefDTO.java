package net.dima.dima5_project.dto.admin;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * 관리자 페이지 최근 문의글 리스트 나 실시간 알림에서 보여줄 간단한 데이터 묶음
 */

@Data
@AllArgsConstructor
@Builder
public class AskBriefDTO {
    private Long askSeq; // 클릭 시 해당 문의 상세 페이지 이동하려고 필요
    private String title; // 리스트 / 알림에 제목 표시
    private String writer; // 작성자 표시
    private LocalDateTime joinDate; // 작성 날짜, 시간 표시
}
