package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayDTO {
    private Long holiday_seq;
    private String holidayDate;
    private String holidayName;
    private String countryNameKr;

}