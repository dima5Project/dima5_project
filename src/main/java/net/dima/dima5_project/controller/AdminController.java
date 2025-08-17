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

    // 뉴스 관리 화면
    @GetMapping("/admin/news")
    public String adminNews() {
        return "adminNews"; // templates/admin/news.html
    }
}
