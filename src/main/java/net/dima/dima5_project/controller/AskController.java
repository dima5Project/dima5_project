package net.dima.dima5_project.controller;

import java.io.FileInputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.FileCopyUtils;
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

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.PostMapping;

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

        return "ask/askList";
    }

    /**
     * 글쓰기 화면 요청
     * 
     * @return
     */
    @GetMapping("/write")
    public String write() {
        return "ask/askWrite";
    }

    /**
     * 글쓰고 나서 DB에 저장 후 목록으로 리다이렉트 부분
     */
    @PostMapping("/write")
    public String askwrite(@ModelAttribute AskBoardDTO askBoardDTO) {
        askService.insertAskBoard(askBoardDTO);
        return "redirect:/ask";
    }

    /**
     * Ajax 요청 처리 - 문의 상세 내용만 fragment로 반환하는 것
     * 토글로 보여주는.. 그것을 쓴 것이긴 함
     * 
     * @param param
     * @return
     */
    @GetMapping("/askDetail")
    public String askDetail(@RequestParam("askSeq") Long askSeq,
            @RequestParam(name = "searchItem", defaultValue = "boardTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord, Model model) {
        AskBoardDTO askBoardDTO = askService.checkOne(askSeq); // 서비스에서 문의 하나 가져오기
        model.addAttribute("ask", askBoardDTO);
        model.addAttribute("searchItem", searchItem);
        model.addAttribute("searchWord", searchWord);
        return "board/boardDetailAjax :: detailFragment"; // thymeleaf fragment만 반환
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
        try {
            String tempName = URLEncoder.encode(
                    originalFilename, StandardCharsets.UTF_8.toString());
            response.setHeader("Content-Disposition", "attachment;filename=" + tempName);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        String fullpath = uploadPath + "/" + savedFilename;
        // 스트림 설정(실제 다운로드가 일어나는 구간)
        FileInputStream filein = null;
        ServletOutputStream fileout = null;
        try {
            filein = new FileInputStream(fullpath);
            fileout = response.getOutputStream();
            FileCopyUtils.copy(filein, fileout);

            fileout.close();
            filein.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
