package net.dima.dima5_project.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WeeklySignupDTO {
    private String monthweek;
    private long count;
}
