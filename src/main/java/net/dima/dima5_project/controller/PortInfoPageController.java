package net.dima.dima5_project.controller;

import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.service.PortInfoService;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import java.util.List;

// 부가정보 페이지 뷰로 보이는 컨트롤러
@Controller
@RequiredArgsConstructor
public class PortInfoPageController {

    private final PortInfoService portInfoService;

    @GetMapping("/port/info")
    public String showPortInfoPage(Model model) throws JsonProcessingException {
        List<PortNameDTO> portNameList = portInfoService.getAllPortNames();
        String json = new ObjectMapper().writeValueAsString(portNameList);
        model.addAttribute("portNameListJson", json); // 반드시 있음!
        return "info";
    }
}
