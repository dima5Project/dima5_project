package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.RequiredArgsConstructor;

// 부가정보 페이지 뷰로 보이는 컨트롤러
@Controller
@RequiredArgsConstructor
public class PortInfoPageController {

    @GetMapping("/port/info")
    public String portInfoPage() {
        return "info";
    }
}
