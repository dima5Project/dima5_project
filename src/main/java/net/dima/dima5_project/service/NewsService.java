package net.dima.dima5_project.service;

import net.dima.dima5_project.dto.NewsBoardDTO;
import net.dima.dima5_project.entity.NewsBoardEntity;
import net.dima.dima5_project.repository.NewsRepository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

    // 레포지토리에서 데이터를 가져와서 검색을 하고 컨트롤러에 넘겨주는 역할
    private final NewsRepository newsRepository;

    /**
     * 뉴스 메인보드 + 페이징(+정렬) + 제목 검색
     */
    public Page<NewsBoardDTO> selectAll(Pageable pageable, String searchWord) {

        // 정렬: newsSeq DESC로 보장 (컨트롤러에서 넘어온 size/page 그대로 사용)
        PageRequest pageReq = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "newsSeq")
        );

        Page<NewsBoardEntity> entityPage;
        String kw = (searchWord == null) ? "" : searchWord.trim();

        if (kw.isBlank()) {
            entityPage = newsRepository.findAll(pageReq);
        } else {
            entityPage = newsRepository.findByNewsTitleContaining(kw, pageReq);
        }

        return entityPage.map(NewsBoardDTO::toDTO);
        
    }

    public List<NewsBoardDTO> getAllnews() {
        List<NewsBoardEntity> temp = newsRepository.findAll(Sort.by(Sort.Direction.DESC, "newsSeq"));
        List<NewsBoardDTO> list = new ArrayList<>();
        temp.forEach(news -> list.add(NewsBoardDTO.toDTO(news)));
        return list;
    }


}
