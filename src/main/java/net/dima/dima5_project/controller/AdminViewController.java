package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class AdminViewController {

    // 문의 상세 / 답변 페이지
    @GetMapping("/admin/asks/{askSeq}")
    public String askDetailPage(@PathVariable Long askSeq, Model model) {
        model.addAttribute("askSeq", askSeq);
        return "askreply";
    }
}
