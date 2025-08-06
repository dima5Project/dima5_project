package net.dima.dima5_project.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortInfoResponseDTO;
import net.dima.dima5_project.entity.PortNameEntity;
import net.dima.dima5_project.repository.PortNameRepository;
import net.dima.dima5_project.service.PortInfoService;

@RestController
@RequestMapping("/api/info")
@RequiredArgsConstructor
public class InfoController {

    private final PortInfoService portInfoService;
    private final PortNameRepository portNameRepository;

    // 단일 항구 정보 조회
    @GetMapping("/{portId}")
    public PortInfoResponseDTO getPortInfo(@PathVariable String portId) {
        return portInfoService.getPortInfo(portId);
    }

    // 전체 항구 부가정보 페이지
    @GetMapping("/all")
    public List<PortInfoResponseDTO> getAllPortInfo() {
        return portInfoService.getAllPortsInfo();
    }

    // 한글 항구명으로 조회하는 엔드포인트
    @GetMapping("/by-name")
    public PortInfoResponseDTO getPortInfoByName(@RequestParam String portName) {
        PortNameEntity nameEntity = portNameRepository.findByPortNameKr(portName)
                .orElseThrow(() -> new RuntimeException("해당 항구명 없음: " + portName));

        String portId = nameEntity.getPortId();

        return portInfoService.getPortInfo(portId); // 기존 메서드 재사용
    }
}
