package net.dima.dima5_project.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortInfoDTO;
import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.entity.PortInfoEntity;
import net.dima.dima5_project.entity.PortNameEntity;
import net.dima.dima5_project.repository.PortInfoRepository;
import net.dima.dima5_project.repository.PortNameRepository;

// 위치 정보 + 이름 정보 포함
@Service
@RequiredArgsConstructor
public class PortInfoService {

        private final PortInfoRepository portInfoRepository;
        private final PortNameRepository portNameRepository;

        public PortInfoDTO gePortInfo(String portId) {
                PortInfoEntity info = portInfoRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 위치 정보 없음"));
                PortNameEntity name = portNameRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 이름 정보 없음"));

                return PortInfoDTO.builder()
                                .portId(info.getPortId())
                                .locLat(info.getLocLat())
                                .locLon(info.getLocLon())
                                .portNameInfo(PortNameDTO.toDTO(name))
                                .build();
        }

        // 위도만 반환
        public double getLatitudeByPortId(String portId) {
                return portInfoRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 위치 정보 없음"))
                                .getLocLat();
        }

        // 경도만 반환
        public double getLongitudeByPortId(String portId) {
                return portInfoRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 위치 정보 없음"))
                                .getLocLon();
        }

}
