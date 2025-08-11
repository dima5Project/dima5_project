package net.dima.dima5_project.service;

import java.util.Optional;

import net.dima.dima5_project.entity.VesselMasterEntity;
import net.dima.dima5_project.repository.AisTimepointRepository;
import net.dima.dima5_project.repository.VesselMasterRepository;

public class VesselService {
    
    private final VesselMasterRepository vesselMasterRepository = null;

    public Optional<String> findVslId(String type, String query) {
        if ("imo".equalsIgnoreCase(type)) {
            return vesselMasterRepository.findByVslImo(query)
                                        .map(VesselMasterEntity::getVslId);
        } else if ("mmsi".equalsIgnoreCase(type)) {
            return vesselMasterRepository.findByVslMmsi(query)
                                        .map(VesselMasterEntity::getVslId);
        }
        return Optional.empty();
    }
    private final AisTimepointRepository aisTimepointRepository = null;

    public Integer getLatestTimepoint(String vslId) {
        return aisTimepointRepository.findLatestTimepointByVslId(vslId)
                .orElseThrow(() -> new RuntimeException("해당 선박의 timepoint 데이터가 없습니다."));
    }
}
