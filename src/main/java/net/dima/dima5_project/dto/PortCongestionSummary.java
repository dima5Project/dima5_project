package net.dima.dima5_project.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PortCongestionSummary {
    private String portId; // "CNNGB" ...
    private String congestionLevel; // "매우 혼잡" | "혼잡" | "원활"
    private Integer currentShips;
    private Integer expectedShips;
    private String updatedAt;
}
