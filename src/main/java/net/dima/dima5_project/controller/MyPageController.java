package net.dima.dima5_project.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.dto.LoginUserDetailsDTO;
import net.dima.dima5_project.dto.PredictUserDTO;
import net.dima.dima5_project.dto.ResultSaveDTO;
import net.dima.dima5_project.entity.ResultSaveEntity;
import net.dima.dima5_project.service.ResultSaveService;
import net.dima.dima5_project.service.UserService;

@Controller
@RequiredArgsConstructor
public class MyPageController {

    private final UserService userService;
    private final ResultSaveService resultSaveService;

    private static final String EDIT_VERIFIED_KEY = "editVerified";

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
        // Page<ResultSaveDTO> savesPage = userService.getMySaves(userId, top3Saves);
        Page<ResultSaveEntity> savesEntityPage = resultSaveService.getMyPage(userId, top3Saves);
        Page<ResultSaveDTO> savesPage = savesEntityPage.map(ResultSaveDTO::toDTO);
        Page<AskBoardDTO> asksPage = userService.getMyAsks(userId, top3Asks);

        model.addAttribute("user", profile);
        model.addAttribute("saves", savesPage); // Page<ResultSaveDTO>
        model.addAttribute("asks", asksPage); // Page<AskBoardDTO>
        model.addAttribute("saveCount", savesPage.getTotalElements());
        model.addAttribute("askCount", asksPage.getTotalElements());

        return "mypage";
    }

    @GetMapping("/mypage")
    public String redirectMyPage() { return "redirect:/mypage/main"; }

    private boolean isVerified(HttpSession session) {
        return Boolean.TRUE.equals(session.getAttribute(EDIT_VERIFIED_KEY));
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

        var login = (LoginUserDetailsDTO) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        PredictUserDTO user = userService.selectOne(login.getUserId());
        model.addAttribute("user", user);

        // 상단 카드 카운트 채우기
        Pageable one = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "saveSeq"));
        long saveCount = userService.getMySaves(login.getUserId(), one).getTotalElements();
        Pageable one2 = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createDate"));
        long askCount = userService.getMyAsks(login.getUserId(), one2).getTotalElements();
        model.addAttribute("saveCount", saveCount);
        model.addAttribute("askCount", askCount);

        return "editInfo";
    }

    @PostMapping("/mypage/update/all")
    public String updateAll(@RequestParam(required = false) String userName,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String newPwd,
            @RequestParam(required = false) String confirmPwd,
            HttpSession session,
            RedirectAttributes ra) {
        if (!isVerified(session))
            return "redirect:/mypage/verify";

        var login = (LoginUserDetailsDTO) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String userId = login.getUserId();

        // 0) 입력 정리
        String name = StringUtils.hasText(userName) ? userName.trim() : null;
        String email = StringUtils.hasText(userEmail) ? userEmail.trim() : null;
        String type = StringUtils.hasText(userType) ? userType.trim() : null;

        // 1) 이메일 중복 체크(자기 자신 제외) - trimmed 값 사용!
        if (StringUtils.hasText(email) && userService.isEmailTakenByOther(userId, email)) {
            ra.addFlashAttribute("error", "이미 사용 중인 이메일입니다.");
            return "redirect:/mypage/update";
        }
        // 2) 프로필 업데이트도 trimmed 값 사용!
        userService.updateProfile(userId, email, name, type);

        // 3) 비밀번호 변경 (둘 중 하나라도 입력되면 검사)
        boolean hasPwdInput = (StringUtils.hasText(newPwd) || StringUtils.hasText(confirmPwd));
        if (hasPwdInput) {
            if (!StringUtils.hasText(newPwd)) {
                ra.addFlashAttribute("error", "새 비밀번호를 입력하세요.");
                return "redirect:/mypage/update";
            }
            if (!newPwd.equals(confirmPwd)) {
                ra.addFlashAttribute("error", "비밀번호가 일치하지 않습니다.");
                return "redirect:/mypage/update";
            }
            userService.updatePassword(userId, newPwd);
        }

        // 4) SecurityContext의 principal 갱신 (상단 카드/헤더에 즉시 반영)
        PredictUserDTO fresh = userService.selectOne(userId);
        LoginUserDetailsDTO refreshed = LoginUserDetailsDTO.builder()
                .userSeq(fresh.getUserSeq())
                .userId(fresh.getUserId())
                .userName(fresh.getUserName())
                .userEmail(fresh.getUserEmail())
                .userType(fresh.getUserType())
                .userRole(fresh.getUserRole())
                // userPwd는 인증에 직접 쓰지 않으니 비워도 됨
                .build();
        var newAuth = new UsernamePasswordAuthenticationToken(
                refreshed, null, refreshed.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(newAuth);

        ra.addFlashAttribute("msg", "개인정보가 저장되었습니다.");
        return "redirect:/mypage/main";
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

    @GetMapping("/mypage/ships")
    public String shipList(Model model, Integer page, Integer size) {
        // 저장 선박 데이터 model에 담기
        var login = (LoginUserDetailsDTO) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String userId = login.getUserId();

        int p = (page == null || page < 0) ? 0 : page;
        int s = (size == null || size <= 0) ? 10 : size;

        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "saveSeq"));
        Page<ResultSaveDTO> saves = userService.getMySaves(userId, pageable);

        model.addAttribute("user", login); // 상단에 사용자 표시용(원하면 제거)
        model.addAttribute("shipPage", saves); // 페이징 전부 필요하면 이거 사용
        model.addAttribute("shipList", saves.getContent()); // HTML에서 간단 반복용
        model.addAttribute("totalShips", saves.getTotalElements());
        
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






}