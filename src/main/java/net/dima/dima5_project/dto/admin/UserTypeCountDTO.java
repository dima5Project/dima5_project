package net.dima.dima5_project.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserTypeCountDTO {
    private String userType;
    private long count;
}
