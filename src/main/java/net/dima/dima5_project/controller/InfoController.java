package net.dima.dima5_project.controller;

import java.util.List;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortInfoResponseDTO;
import net.dima.dima5_project.service.PortInfoService;

@RestController
@RequestMapping("/api/info")
@RequiredArgsConstructor
public class InfoController {

    private final PortInfoService portInfoService;

    // 단일 항구 정보 조회
    @GetMapping("/{portId}")
    public PortInfoResponseDTO getPortInfo(@PathVariable String portId) {
        return portInfoService.getPortInfo(portId);
    }

    // 전체 항구 부가정보 페이지
    @GetMapping("/all")
    public String showAllPortsInfo(Model model) {
        List<PortInfoResponseDTO> portList = portInfoService.getAllPortsInfo();
        model.addAttribute("portList", portList);
        return "port_info"; // templates/port_info.html 로 렌더링
    }
}
