package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.HolidayEntity;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayDTO {
    private Long holidaySeq;
    private String holidayDate;
    private String countryNameKr;
    private String holidayName;

    public static HolidayDTO fromEntity(HolidayEntity entity) {
        return HolidayDTO.builder()
                .holidaySeq(entity.getHolidaySeq())
                .holidayDate(entity.getHolidayDate())
                .countryNameKr(entity.getCountryNameKr())
                .holidayName(entity.getHolidayName())
                .build();
    }
}