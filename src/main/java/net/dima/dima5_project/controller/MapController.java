package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestParam;

@Controller
// @RequiredArgsConstructor // final로 선언된 필드를 자동으로 생성자 주입
@Slf4j
public class MapController {

    @GetMapping("/predict/init")
    public String viewMap() {
        return "portpredict";
    }

}
