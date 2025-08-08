package net.dima.dima5_project.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.HolidayDTO;
import net.dima.dima5_project.repository.HolidayRepository;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;

    /**
     * 오늘 날짜를 기준으로 해당 국가의 공휴일 여부 확인
     * 
     * @param countryNameKr
     * @return
     */
    public HolidayDTO getTodayHolidayByCountry(String countryNameKr) {
        String today = LocalDate.now().toString();
        return holidayRepository.findByCountryNameKrAndHolidayDate(countryNameKr, today)
                .map(HolidayDTO::fromEntity)
                .orElse(null);
    }

    /**
     * 특정 국가의 모든 공휴일 조회
     * 
     * @param countryNameKr
     * @return
     */
    public List<HolidayDTO> getAllHolidaysByCountry(String countryNameKr) {
        return holidayRepository.findByCountryNameKr(countryNameKr)
                .stream()
                .map(HolidayDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<HolidayDTO> getAllHolidays() {
        return holidayRepository.findAll()
                .stream()
                .map(HolidayDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
