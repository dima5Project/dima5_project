package net.dima.dima5_project.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.entity.PortNameEntity;
import net.dima.dima5_project.repository.PortNameRepository;

@Service
@RequiredArgsConstructor
public class PortNameService {

    private final PortNameRepository portNameRepository;

    public List<PortNameDTO> getPortNamesByCountry(String countryNameKr) {
        List<PortNameEntity> entities = portNameRepository.findByCountryNameKr(countryNameKr);

        return entities.stream()
                .map(port -> PortNameDTO.builder()
                        .portId(port.getPortInfo().getPortId())
                        .portNameKr(port.getPortNameKr())
                        .build())
                .collect(Collectors.toList());
    }
}
