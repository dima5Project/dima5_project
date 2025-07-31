package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {
    
    /**
     * 첫 화면 요청
     */
    @GetMapping("/")
    public String getMethodName() {
        return "banner";
    }
    
}
