package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeZoneDTO {
    private String countryName;
    // private String timezone;
    private String currentTime;
    private String utcOffset; // +09:00
    private String dayOfWeek; // 금요일
}
