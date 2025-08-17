package net.dima.dima5_project.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
         * 월별 주차 가입자 수 (최근 N주, 빈 주는 0으로 채움)
         * 프론트 요구 포맷: [{ monthWeek: "8월 1주", count: 3 }, ...]
         */
        /** 월별 주차 가입자 수 - 최근 N주, 월요일 시작, 연속 주차, 0 채우기 */
        public List<WeeklySignupDTO> getWeeklySignups(int weeks) {
                if (weeks <= 0)
                        weeks = 12;

                // 이번 주 월요일
                LocalDate thisMonday = LocalDate.now()
                                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

                // 시작 주(weeks-1주 전)의 월요일
                LocalDate startMonday = thisMonday.minusWeeks(weeks - 1);
                LocalDateTime from = startMonday.atStartOfDay();

                // from 이후 가입자 모두 로드
                var users = predictUserRepository.findByJoinDateGreaterThanEqual(from);

                // 주 시작(월요일) 날짜로 그룹핑
                Map<LocalDate, Long> countByWeek = users.stream()
                                .collect(Collectors.groupingBy(
                                                u -> u.getJoinDate()
                                                                .toLocalDate()
                                                                .with(TemporalAdjusters
                                                                                .previousOrSame(DayOfWeek.MONDAY)),
                                                Collectors.counting()));

                // 연속 주차 목록 생성 + 0 채우기 + "M월 k주" 라벨 만들기
                List<WeeklySignupDTO> result = new ArrayList<>(weeks);
                for (int i = 0; i < weeks; i++) {
                        LocalDate weekStart = startMonday.plusWeeks(i);

                        int weekOfMonth = ((weekStart.getDayOfMonth() - 1) / 7) + 1;
                        String label = weekStart.getMonthValue() + "월 " + weekOfMonth + "주";

                        long cnt = countByWeek.getOrDefault(weekStart, 0L);
                        result.add(new WeeklySignupDTO(label, cnt));
                }
                return result;
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
