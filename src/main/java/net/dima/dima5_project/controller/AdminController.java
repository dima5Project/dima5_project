package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminController {

    // 대시보드 진입
    @GetMapping("/admin")
    public String adminDashboard() {
        return "adminDashboard";
    }

}
