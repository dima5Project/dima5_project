package net.dima.dima5_project.controller;

import org.hibernate.query.Page;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.service.AskService;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping
@Slf4j
@RequiredArgsConstructor
public class AskController {
    private final AskService askService;

    // 한페이지에 보여줄 글 갯수
    @Value("${user.board.pageLimit}")
    int pageLimit;

    @Value("${spring.servlet.multipart.location}")
    String uploadPath;

    @GetMapping("/askList")
    public void askList(
            @PageableDefault(page = 1) Pageable pageable,
            @RequestParam(name = "searchItem", defaultValue = "askTitle") String searchItem,
            @RequestParam(name = "searchWord", defaultValue = "") String searchWord,
            Model model) {

        log.info("검색값 : {}, {}, 요청페이지 : {}", searchItem, searchWord, pageable.getPageNumber());

        // DB에서 데이터 가져옴
        Page<AskBoardDTO> list = askService.selectAll(pageable, searchItem, searchWord);
    }
}
