package net.dima.dima5_project.service;

import net.dima.dima5_project.dto.NewsBoardDTO;
import net.dima.dima5_project.entity.NewsBoardEntity;
import net.dima.dima5_project.repository.NewsRepository;

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

    int pageLimit = 9; // 페이지당 뉴스 수

    /**
     * 뉴스 메인보드 + 페이징 기능
     * @param pageable
     * @param keyword
     * @return
     */
    public Page<NewsBoardDTO> getPagedNews(Pageable pageable, String keyword){

        int page = pageable.getPageNumber() - 1; // 사용자가 1 페이지 요청 : page = 0

        // 검색어 + 페이징 이용한 조회
        Page<NewsBoardEntity> entityPage = null; //  뉴스 엔티티들을 여러 개 담을 공간 생성, 한 페이지 분량만 담을 수 있는 Page 타입으로 선언
        Page<NewsBoardDTO> dtoPage = null;

        // 검색어가 없으면 전체 뉴스를 불러옴
        if(keyword == null || keyword.isEmpty()){
            entityPage = newsRepository.findAll(
                // 페이지 요청 : 몇 번째 페이지, 몇 개씩, 어떤 순서로 정렬할지를 지정
                PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "newsSeq")));
        } else {
            entityPage = newsRepository.findByNewsTitleContaining(
                keyword, 
                PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "newsSeq")));
        }

        dtoPage = entityPage.map(NewsBoardDTO::toDTO);

        return dtoPage; // DTO 를 페이지 단위로 담아서 반환
    }

}
