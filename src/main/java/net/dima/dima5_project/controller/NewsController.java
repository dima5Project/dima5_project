package net.dima.dima5_project.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.NewsBoardDTO;
import net.dima.dima5_project.service.NewsService;


@Controller
@RequestMapping("/news") // 공통 주소 선언
@RequiredArgsConstructor // final로 선언된 필드를 자동으로 생성자 주입
public class NewsController {

    public final NewsService newsService;
    
    /**
     * 뉴스 메인 페이지에 뉴스리스트 출력 + 검색어 전달
     * @param page
     * @param keyword
     * @param model
     * @return news.html
     */
    @GetMapping("/main")
    public String main(
            @RequestParam(name="page", defaultValue = "1") int page,
            @RequestParam(name="keyword", required = false) String keyword,
            Model model) {

            Pageable pageable = PageRequest.of(page - 1, 9); // 한 페이지에 9개
            Page<NewsBoardDTO> newsList = newsService.getPagedNews(pageable, keyword);

            // HTML에서 사용할 수 있도록 값을 model에 넘겨줌
            model.addAttribute("newsList", newsList);
            model.addAttribute("page", page);
            model.addAttribute("keyword", keyword);
        
            return "news";
    }
    

}
