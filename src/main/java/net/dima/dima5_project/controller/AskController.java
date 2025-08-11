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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

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

    // @GetMapping("")
    // public String ask(
    // @PageableDefault(page = 1) Pageable pageable,
    // @RequestParam(name = "searchItem", defaultValue = "askTitle") String
    // searchItem,
    // @RequestParam(name = "searchWord", defaultValue = "") String searchWord,
    // Model model) {

    // log.info("검색값 : {}, {}, 요청페이지 : {}", searchItem, searchWord,
    // pageable.getPageNumber());

    // // DB에서 데이터 가져옴
    // Page<AskBoardDTO> list = askService.selectAll(pageable, searchItem,
    // searchWord);

    // int totalPages = list.getTotalPages(); // 전체 페이지 수
    // int page = pageable.getPageNumber(); // 사용자가 요청한 페이지

    // PageNavigator navi = new PageNavigator(pageLimit, page, totalPages);

    // model.addAttribute("list", list);
    // model.addAttribute("searchItem", searchItem);
    // model.addAttribute("searchWord", searchWord);
    // model.addAttribute("navi", navi);

    // return "ask/askList";
    // }

    // /**
    // * 글쓰기 화면 요청
    // *
    // * @return
    // */
    // @GetMapping("/askwrite")
    // public String write() {
    // return "ask/askwrite";
    // }

    // /**
    // * 글쓰고 나서 DB에 저장 후 목록으로 리다이렉트 부분
    // */
    // @PostMapping("/write")
    // public String askwrite(@ModelAttribute AskBoardDTO askBoardDTO) {
    // askService.insertAskBoard(askBoardDTO);
    // return "redirect:/ask";
    // }

    @GetMapping("")
    public String ask(
            @RequestParam(defaultValue = "0") int page, // 0-base
            @RequestParam(name = "searchItem", defaultValue = "askTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord,
            Model model) {

        // 프런트 옵션에 맞춘 정규화
        String key = switch (searchItem == null ? "" : searchItem) {
            case "", "askTitle", "qnaTitle" -> "askTitle"; // 빈값/옛값 qnaTitle → 제목
            case "writer", "qnaWriter" -> "writer"; // 옛값 qnaWriter → 글쓴이
            case "all" -> "all"; // "전체(글쓴이+제목)"
            default -> "askTitle";
        };

        Pageable pageable = PageRequest.of(page, 10, Sort.by(Sort.Direction.DESC, "askSeq"));

        log.info("[ASK] key={}, word='{}', page={}, size={}", key, searchWord, page, pageable.getPageSize());

        Page<AskBoardDTO> list = askService.selectAll(pageable, key, searchWord);

        int totalPages = list.getTotalPages();
        PageNavigator navi = new PageNavigator(pageLimit, page, totalPages);

        model.addAttribute("list", list);
        model.addAttribute("searchItem", searchItem);
        model.addAttribute("searchWord", searchWord);
        model.addAttribute("navi", navi);

        return "ask/askList";
    }

    @GetMapping("/write")
    public String write() {
        return "ask/askwrite";
    }

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
            @RequestParam(name = "searchItem", defaultValue = "askTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord,
            @RequestParam(name = "pwd", required = false) String pwd, // 추가
            Model model) {

        // DTO 가져오기
        AskBoardDTO askBoardDTO = askService.checkOne(askSeq);

        // 비밀글 여부 & 열람 가능 여부
        boolean isSecret = (askBoardDTO.getAskPwd() != null && !askBoardDTO.getAskPwd().isBlank());
        boolean canView = !isSecret || (pwd != null && pwd.equals(askBoardDTO.getAskPwd()));

        model.addAttribute("ask", askBoardDTO);
        model.addAttribute("searchItem", searchItem);
        model.addAttribute("searchWord", searchWord);
        model.addAttribute("canView", canView); // 추가

        return "ask/askDetailAjax :: detailFragment"; // thymeleaf fragment만 반환
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

    @GetMapping("/checkPassword")
    @ResponseBody
    public boolean checkPassword(@RequestParam Long askSeq, @RequestParam String pwd) {
        AskBoardDTO askBoardDTO = askService.checkOne(askSeq);
        if (askBoardDTO == null)
            return false;

        // 비밀글이 아니면 무조건 열람 가능
        if (askBoardDTO.getAskPwd() == null || askBoardDTO.getAskPwd().isBlank()) {
            return true;
        }

        // 비밀번호 일치 여부
        return askBoardDTO.getAskPwd().equals(pwd.trim());
    }

}
