package net.dima.dima5_project.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.service.AskService;
import net.dima.dima5_project.util.PageNavigator;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@Controller
@RequestMapping("/ask")
@Slf4j
@RequiredArgsConstructor
public class AskController {

    private final AskService askService;

    // 한페이지에 보여줄 글 갯수
    @Value("${ask.board.pageLimit}")
    int pageLimit;

    @Value("${spring.servlet.multipart.location}")
    String uploadPath;

    /**
     * 글쓰기 페이지로 로딩이 됨... 하아
     */
    @GetMapping("")
    public String ask(
            @PageableDefault(page = 1) Pageable pageable,
            @RequestParam(name = "searchItem", defaultValue = "askTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord,
            Model model) {

        log.info("검색값 : {}, {}, 요청페이지 : {}", searchItem, searchWord, pageable.getPageNumber());

        // DB에서 데이터 가져옴
        Page<AskBoardDTO> list = askService.selectAll(pageable, searchItem, searchWord);

        int totalPages = list.getTotalPages(); // 전체 페이지 수
        int page = pageable.getPageNumber(); // 사용자가 요청한 페이지

        PageNavigator navi = new PageNavigator(pageLimit, page, totalPages);

        model.addAttribute("list", list);
        model.addAttribute("searchItem", searchItem);
        model.addAttribute("searchWord", searchWord);
        model.addAttribute("navi", navi);

        return "ask";
    }

    /**
     * 글쓰기 화면 요청
     * 
     * @return
     */
    @GetMapping("/write")
    public String write() {
        return "ask/write";
    }

    /**
     * 글 자세히 보기
     * 
     * @param askboardDTO
     * @return
     */
    @PostMapping("/askWrite")
    public String askWrite(@ModelAttribute AskBoardDTO askboardDTO) {
        askService.insertAskBoard(askboardDTO);
        return "redirect:/ask/askList";
    }

    /**
     * 답변 토글 열리기 + 조회
     */
    public String askDetail(@RequestParam(name = "askSeq") Long askSeq,
            @RequestParam(name = "searchItem", defaultValue = "askTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord, Model model) {
        AskBoardDTO askBoardDTO = askService.checkOne(askSeq);
        model.addAttribute("ask", askBoardDTO);
        model.addAttribute("searchItem", searchItem);
        model.addAttribute("searchWord", searchWord);
        return "ask/askDetailAjax :: detailFragment";
    }

    /**
     * 문의 글 삭제
     */
    @GetMapping("/askDelete")
    public String askDelete(@RequestParam(name = "askSeq") Long askSeq,
            @RequestParam(name = "searchItem", defaultValue = "askTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord, RedirectAttributes rttr) {
        askService.deleteOne(askSeq);
        rttr.addAttribute("searchItem", searchItem);
        rttr.addAttribute("searchWord", searchWord);

        return "redirect:/ask/askList";
    }

    /**
     * 첨부파일 다운로드
     */
    @GetMapping("/download")
    public String download(@RequestParam(name = "askSeq") Long askSeq, HttpServletResponse response) {
        AskBoardDTO askBoardDTO = askService.checkOne(askSeq);
        log.info("첨부파일명: {}", askBoardDTO.getSavedFilename());
        String originalFilename = askBoardDTO.getOriginalFilename();
        String savedFilename = askBoardDTO.getSavedFilename();
        try{
            String tempName = URLEncoder.encode(
                originalFilename, StandardCharsets.UTF_8.toString());
                response.setHeader("Content-Disposition", "attachment;filename=" + tempName);
        } catch (UnsupportedEncodingException e) {}
        
        return null;
    }

}
