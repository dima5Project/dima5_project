package net.dima.dima5_project.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.dto.LoginUserDetailsDTO;
import net.dima.dima5_project.dto.PredictUserDTO;
import net.dima.dima5_project.dto.ResultSaveDTO;
import net.dima.dima5_project.service.UserService;

@Controller
@Slf4j
@RequiredArgsConstructor
public class UserController {

    public final UserService userService;

    private static final String EDIT_VERIFIED_KEY = "editVerified";

    /**
     * 1) 로그인 화면 요청
     * 2) 아이디와 비번을 잘못 입력한 경우: CustomLoginFailureHandler가 가로채서 이곳으로 보냄
     * 
     * @return
     */
    @GetMapping("/user/login")
    public String login(
            // 1) 로그인 화면 요청 시, error = false / 2) 잘못 입력한 경우, error = true
            // @RequestParam(name="error", required = false) boolean error,
            // @RequestParam(name="errMessage", required = false) String errMessage,
            HttpServletRequest request,
            Model model) {

        // log.info("에러: {}", error);
        // log.info("에러메세지: {}", errMessage);

        // model.addAttribute("error", error);
        // model.addAttribute("errMessage", errMessage); // 핸들러가 처리해서 보낸 메세지

        String refererUrl = request.getHeader("Referer");
        HttpSession session = request.getSession();

        // if(refererUrl != null)
        // if(!error && !refererUrl.contains("login")) {
        // session.setAttribute("refererUrl", refererUrl);
        // log.info("{}", refererUrl);
        // System.out.println("login 함수 내: " + refererUrl);
        // }

        if (refererUrl != null && !refererUrl.contains("login")) {
            session.setAttribute("refererUrl", refererUrl);
            log.info("referer: {}", refererUrl);
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
     * 중복 아이디가 존재하는지 확인
     */
    @ResponseBody
    @PostMapping("/user/confirmId")
    public boolean confirmId(@RequestParam(name = "userId") String userId) {

        return userService.selectOne(userId) == null; // 중복 없으면 true
    }

    /*
     * 마이페이지 접속
     */
    @GetMapping("/mypage/main")
    public String myPage(Model model) {
        // 로그인 사용자
        var login = (LoginUserDetailsDTO) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String userId = login.getUserId();

        // Top-3 페이지
        Pageable top3Saves = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "saveSeq"));
        Pageable top3Asks = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "createDate"));

        PredictUserDTO profile = userService.getProfile(userId);
        Page<ResultSaveDTO> savesPage = userService.getMySaves(userId, top3Saves);
        Page<AskBoardDTO> asksPage = userService.getMyAsks(userId, top3Asks);

        model.addAttribute("user", profile);
        model.addAttribute("saves", savesPage); // Page<ResultSaveDTO>
        model.addAttribute("asks", asksPage); // Page<AskBoardDTO>
        model.addAttribute("saveCount", savesPage.getTotalElements());
        model.addAttribute("askCount", asksPage.getTotalElements());

        return "mypage"; // 네가 올려준 mypage.html
    }

    private boolean isVerified(HttpSession session) {
        return Boolean.TRUE.equals(session.getAttribute(EDIT_VERIFIED_KEY));
    }

    /**
     * 비밀번호 재확인 화면
     * 
     * @return
     */
    @GetMapping("/mypage/verify")
    public String verifyForm() {
        return "checkPassword"; // 비밀번호 한 칸 폼
    }

    /**
     * 비밀번호 재확인 처리
     * 
     * @param password
     * @param session
     * @param model
     * @return
     */
    @PostMapping("/mypage/verify")
    public String verifyProc(@RequestParam("password") String password,
            HttpSession session,
            Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        LoginUserDetailsDTO login = (LoginUserDetailsDTO) auth.getPrincipal();

        if (userService.verifyPassword(login.getUserId(), password)) {
            session.setAttribute(EDIT_VERIFIED_KEY, true); // 시간제한 없음
            return "redirect:/mypage/update";
        } else {
            model.addAttribute("error", "비밀번호가 올바르지 않습니다.");
            return "redirect:/mypage/verify";
        }
    }

    /**
     * 개인정보 수정 페이지 (접근 보호)
     * 
     * @param model
     * @return
     */
    @GetMapping("/mypage/update")
    public String myPageUpdate(Model model, HttpSession session) {
        if (!isVerified(session))
            return "redirect:/mypage/verify";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        LoginUserDetailsDTO login = (LoginUserDetailsDTO) auth.getPrincipal();

        PredictUserDTO user = userService.selectOne(login.getUserId());
        model.addAttribute("user", user);
        return "editInfo";
    }

    /**
     * 프로필(이메일/이름/유형) 수정
     */
    @PostMapping("/mypage/update/profile")
    @ResponseBody
    public String updateProfile(@RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userType,
            HttpSession session) {

        if (!isVerified(session))
            return "NEED_VERIFY";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        LoginUserDetailsDTO login = (LoginUserDetailsDTO) auth.getPrincipal();

        userService.updateProfile(login.getUserId(), userEmail, userName, userType);

        return "redirect:/mypage/main";
    }

    /**
     * 비밀번호 변경
     * 
     * @param newPwd
     * @param confirmPwd
     * @param session
     * @return
     */
    @PostMapping("/mypage/update/password")
    public String updatePassword(@RequestParam String newPwd,
            @RequestParam String confirmPwd,
            HttpSession session) {
        if (!isVerified(session))
            return "NEED_VERIFY";
        if (newPwd == null || newPwd.isBlank())
            return "새 비밀번호를 입력하세요.";
        if (!newPwd.equals(confirmPwd))
            return "비밀번호가 일치하지 않습니다.";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        LoginUserDetailsDTO login = (LoginUserDetailsDTO) auth.getPrincipal();

        userService.updatePassword(login.getUserId(), newPwd);
        return "redirect:/mypage/main";
    }

    @GetMapping("/mypage/ships")
    public String shipList(Model model, Integer page, Integer size) {
        // 저장 선박 데이터 model에 담기
        var login = (LoginUserDetailsDTO) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String userId = login.getUserId();

        int p = (page == null || page < 0) ? 0 : page;
        int s = (size == null || size <= 0) ? 10 : size;

        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "saveSeq"));
        Page<ResultSaveDTO> shipPage = userService.getMySaves(userId, pageable);

        model.addAttribute("user", login); // 상단에 사용자 표시용(원하면 제거)
        model.addAttribute("shipPage", shipPage); // 페이징 전부 필요하면 이거 사용
        model.addAttribute("shipList", shipPage.getContent()); // HTML에서 간단 반복용
        model.addAttribute("totalShips", shipPage.getTotalElements());
        return "myshipList";
    }

    @GetMapping("/mypage/asks")
    public String askList(Model model, Integer page, Integer size) {
        // 문의 내역 데이터 model에 담기
        var login = (LoginUserDetailsDTO) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String userId = login.getUserId();

        int p = (page == null || page < 0) ? 0 : page;
        int s = (size == null || size <= 0) ? 10 : size;

        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "createDate"));
        Page<AskBoardDTO> askPage = userService.getMyAsks(userId, pageable);

        model.addAttribute("user", login);
        model.addAttribute("askPage", askPage);
        model.addAttribute("askList", askPage.getContent());
        model.addAttribute("totalAsks", askPage.getTotalElements());
        return "myasks";
    }

    @ModelAttribute("user")
    public PredictUserDTO addLoggedInUserToModel() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof LoginUserDetailsDTO login) {
            return userService.selectOne(login.getUserId());
        }
        return null; // 비로그인 등
    }
}
