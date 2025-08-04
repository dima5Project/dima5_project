package net.dima.dima5_project.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "port_docking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortDockingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 데이터 기준 시각 (최신값만 뽑는 데 유용)
    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "port_name")
    private String portName;

    @Column(name = "expected_ships")
    private Integer expectedShips;

    @Column(name = "ships_in_port")
    private Integer shipsInPort;
}
