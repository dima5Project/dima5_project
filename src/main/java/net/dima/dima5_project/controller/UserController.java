package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PredictUserDTO;
import net.dima.dima5_project.service.UserService;

@Controller
@Slf4j
public class UserController {

    public final UserService userService = null;

    /**
     * 1) 로그인 화면 요청
     * 2) 아이디와 비번을 잘못 입력한 경우: CustomLoginFailureHandler가 가로채서 이곳으로 보냄
     * @return
     */
    @GetMapping("/user/login")
    public String login ( 
        // 1) 로그인 화면 요청 시, error = false / 2) 잘못 입력한 경우, error = true
        @RequestParam(name="error", required = false) boolean error, 
        @RequestParam(name="errMessage", required = false) String errMessage,
        HttpServletRequest request,
        Model model
        ) {

        //log.info("에러: {}", error);
        //log.info("에러메세지: {}", errMessage);

        model.addAttribute("error", error);
        model.addAttribute("errMessage", errMessage); // 핸들러가 처리해서 보낸 메세지

        // 로그인 X -> 글쓰기 요청 : 로그인 화면으로 리다이렉트
        // 로그인 시도 -> 성공! -> index로 가면 안됨!, 로그인을 시도한 바로 직전이 어디였나 확인함!
        String refererUrl = request.getHeader("Referer");

        // 1) 로그인을 요청한 이전 페이지를 세션에 잠시 저장하는 작업
        HttpSession session = request.getSession();
        
        if(refererUrl != null)
        if(!error && !refererUrl.contains("login")) {
            session.setAttribute("refererUrl", refererUrl);
            log.info("{}", refererUrl);
            System.out.println("login 함수 내: " + refererUrl);
        }

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
    @PostMapping("/user/confirmId")
    public boolean confirmId(@RequestParam(name = "userId") String userId) {
        PredictUserDTO dto = userService.selectOne(userId);

        if (dto == null)
            return true;
        return false;
    }

}
