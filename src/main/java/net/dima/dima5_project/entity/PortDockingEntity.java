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
    @Column(name = "dockingId")
    private Long dockingId;;

    // 데이터 기준 시각 (최신값만 뽑는 데 유용)
    @Column(name = "time_stamp")
    private LocalDateTime timeStamp;

    @Column(name = "port_id")
    private String portId;

    @Column(name = "expected_ships")
    private Integer expectedShips;

    @Column(name = "current_ships")
    private Integer currentShips;
}
