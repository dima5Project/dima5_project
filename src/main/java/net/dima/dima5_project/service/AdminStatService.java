package net.dima.dima5_project.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.admin.AskBriefDTO;
import net.dima.dima5_project.dto.admin.UserTypeCountDTO;
import net.dima.dima5_project.dto.admin.WeeklySignupDTO;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.repository.PredictUserRepository;

@Service
@RequiredArgsConstructor
public class AdminStatService {
        private final PredictUserRepository predictUserRepository;
        private final AskBoardRepository askBoardRepository;

        /**
         * 사용자 유형 분포
         */
        public List<UserTypeCountDTO> getUserTypeCounts() {
                return predictUserRepository.countByUserType().stream()
                                .map(a -> new UserTypeCountDTO(
                                                String.valueOf(a[0]),
                                                ((Number) a[1]).longValue()))
                                .collect(Collectors.toList());
        }

        /**
         * 월별 주차 가입자 수(최근 N주 기준으로 시작일 계산)
         */
        public List<WeeklySignupDTO> getWeeklySignups(int weeks) {
                // 최근 8주 기준
                LocalDateTime from = LocalDate.now().minusWeeks(8).atStartOfDay();

                List<Object[]> result = predictUserRepository.countWeeklySignups(from);

                return result.stream()
                                .map(r -> new WeeklySignupDTO(
                                                ((Integer) r[0]), // 주차 (또는 주차 index)
                                                ((Long) r[1]) // 가입자 수
                                ))
                                .toList();
        }

        /**
         * 최근 문의 목록
         */
        public List<AskBriefDTO> getRecentAsks(int limit) {
                return askBoardRepository.findRecent(PageRequest.of(0, limit)).stream()
                                .map(a -> AskBriefDTO.builder()
                                                .askSeq(a.getAskSeq())
                                                .title(a.getAskTitle())
                                                .writer(a.getWriter().getUserId())
                                                .createDate(a.getCreateDate())
                                                .build())
                                .toList();
        }

}
