package net.dima.dima5_project.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.entity.ResultSaveEntity;
import net.dima.dima5_project.service.ResultSaveService;

@Controller
@RequiredArgsConstructor
public class ResultSaveController {
    
    private final ResultSaveService resultSaveService;

    /**
     * 마이페이지 (내 선박 저장)의 재검색 버튼 클릭 시, 예측 페이지로 돌아와 입력셀에 선박명 입력됨
     * @param vsl
     * @param model
     * @return
     */
    @GetMapping("/predict")
    public String predict(@RequestParam(required=false) String vsl, Model model){
        model.addAttribute("prefillVsl", vsl);
        return "predict/index";
    }

    /**
     * 마이페이지 > 내 선박 저장 목록 화면 랜더링
     * - 로그인 사용자의 저장 이력을 페이징으로 조회하여 모델에 담고 템플릿 반환
     * @param page                페이지 번호 (0 부터)
     * @param size                페이지 크기
     * @param userId              로그인 사용자 ID
     * @param model               타임리프 모델
     * @return                    "mypage/saved" 템플릿 
     */
    @GetMapping("/mypage/saved")
    public String mySaved(@RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @AuthenticationPrincipal(expression = "username") String userId,
                        Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ResultSaveEntity> saves = resultSaveService.getMyPage(userId, pageable);

        model.addAttribute("page", saves);
        return "mypage/saved"; // 타임리프 템플릿
    }

}
