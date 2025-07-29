package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="port_pso")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortPsoEntity {
    
    @Id
    @Column(name="pso_seq")
    private int psoSeq;

    @Column(name="port_id")
    private String portId;
    
    @Column(name="pso_lat")
    private String psoLat;

    @Column(name="pso_lon")
    private String pso_lon;

}
