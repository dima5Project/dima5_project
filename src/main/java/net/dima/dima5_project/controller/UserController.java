package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class UserController {
    
    //public final UserService userService = null;

    /**
     * 로그인 화면 요청
     * @return
     */
    @GetMapping("/user/login")
    public String login() {
        return "login";
    }

    /**
     * 회원가입 화면 요청
     * @return
     */
    @GetMapping("/user/join")
    public String join() {
        return "join";
    }

    /**
     * 회원가입 처리 요청
     * @param predictUserDTO
     * @return
     */
    // @PostMapping("/joinProc")
    // public String joinProc(@ModelAttribute PredictUserDTO predictUserDTO) {
    //     log.info("회원정보를 출력: {}", predictUserDTO.toString());

    //     userService.join(predictUserDTO);
        
    //     return "redirect:/";
    // }
    
    
}
