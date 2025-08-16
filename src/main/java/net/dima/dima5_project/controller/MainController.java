package net.dima.dima5_project.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import net.dima.dima5_project.dto.LoginUserDetailsDTO;

@Controller
public class MainController {

    /**
     * 첫 화면 요청 (로그인 성공하면 Controller에서 정보를 얻어오도록)
     * @return
     */
    @GetMapping({"/", ""})
    public String index(
        @AuthenticationPrincipal LoginUserDetailsDTO loginUser, // 서버쪽에서 사용자 정보를 가져옴
        Model model
    ) {
        // 로그인을 한 경우
        if(loginUser != null) {
            model.addAttribute("loginName", loginUser.getUserName());
        }

        return "banner";  // index.html 문서
    }

}