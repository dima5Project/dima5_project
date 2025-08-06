package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PredictUserDTO;
import net.dima.dima5_project.service.UserService;

@Controller
@Slf4j
public class UserController {

    public final UserService userService = null;

    /**
     * 로그인 화면 요청
     * 
     * @return
     */
    @GetMapping("/user/login")
    public String login() {
        return "login";
    }

    /**
     * 회원가입 화면 요청
     * 
     * @return
     */
    @GetMapping("/user/join")
    public String join() {
        return "join";
    }

    /**
     * 회원가입 처리 요청
     * 
     * @param predictUserDTO
     * @return
     */
    @PostMapping("/user/joinProc")
    public String joinProc(@ModelAttribute PredictUserDTO predictUserDTO) {
        log.info("회원정보를 출력: {}", predictUserDTO.toString());

        userService.join(predictUserDTO);

        return "redirect:/";
    }

    /**
     * 중복 아이디각 존재하는지 확인
     */
    @ResponseBody
    @PostMapping("/confirmId")
    public boolean confirmId(@RequestParam(name = "userId") String userId) {
        PredictUserDTO dto = userService.selectOne(userId);

        if (dto == null)
            return true;
        return false;
    }

}
