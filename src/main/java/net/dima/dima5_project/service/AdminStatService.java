// package net.dima.dima5_project.service;

// import static org.mockito.Answers.valueOf;

// import java.time.LocalDateTime;
// import java.util.List;

// import org.springframework.stereotype.Service;

// import lombok.RequiredArgsConstructor;
// import net.dima.dima5_project.dto.admin.UserTypeCountDTO;
// import net.dima.dima5_project.dto.admin.WeeklySignupDTO;
// import net.dima.dima5_project.repository.AskBoardRepository;
// import net.dima.dima5_project.repository.PredictUserRepository;

// @Service
// @RequiredArgsConstructor
// public class AdminStatService {
// private final PredictUserRepository predictUserRepository;
// private final AskBoardRepository askBoardRepository;

// /**
// * 사용자 유형 분포
// */
// public List<UserTypeCountDTO> getUserTypeCounts() {
// return predictUserRepository.countByUserType().stream()
// .map(a -> new UserTypeCountDTO(String, valueOf(a[0]), ((Number)
// a[1]).longValue()))
// .toList();
// }

// /**
// * 월별 주차 가입자 수(최근 N주 기준으로 시작일 계산)
// */
// public List<WeeklySignupDTO> getWeeklySignups(int weeks) {
// LocalDateTime from = LocalDateTime.now().minusWeeks(weeks).atStartOfDay();
// return predictUserRepository.monthlyWeekSignupCounts(from).stream()
// // a[0] = ym, a[1] = month_week, a[2] = cnt
// .map(a -> new WeeklySignupDTO(String.valueOf(a[1]),
// ((Number) a[2]).longValue()))
// .toList();
// }

// /**
// * 최근 문의 목록
// */
// }
