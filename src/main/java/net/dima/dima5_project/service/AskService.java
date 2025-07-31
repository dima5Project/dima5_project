package net.dima.dima5_project.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.entity.AskBoardEntity;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.util.FileService;

@Service
@Slf4j
@RequiredArgsConstructor
public class AskService {

    private final AskBoardRepository askBoardRepository;

    // 글개수
    @Value("${ask.board.pageLimit}")
    int pageLimit;

    // 파일 저장 변수 선언
    @Value("${file.upload.path}")
    private String uploadPath;

    /**
     * 1) 단순 조회
     * 2) 검색어를 이용한 조회
     * 3) 검색기능 + 페이징
     * 
     * @param pageable
     * @param searchItem
     * @param searchWord
     * @return
     */
    public Page<AskBoardDTO> selectAll(Pageable pageable, String searchItem, String searchWord) {
        // 페이징을 위한 사전 작업
        int page = pageable.getPageNumber() - 1;

        // 검색어 + 페이징 이용한 조회
        Page<AskBoardEntity> temp = null;
        Page<AskBoardDTO> list = null;

        switch (searchItem) {
            case "askTitle":
                temp = askBoardRepository.findByAskTitleContains(
                        searchWord,
                        PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "askSeq")));
                break;

            case "writer":
                temp = askBoardRepository.findByWriterContains(
                        searchWord,
                        PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "askSeq")));
                break;

            case "askContent":
                temp = askBoardRepository.findByAskContentContains(
                        searchWord,
                        PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "askSeq")));
                break;
        }

        list = temp.map((askboard) -> AskBoardDTO.builder()
                .askSeq(askboard.getAskSeq())
                .askType(askboard.getAskType())
                .askTitle(askboard.getAskTitle())
                .askContent(askboard.getAskContent())
                .writer(askboard.getWriter())
                .createDate(askboard.getCreateDate())
                .originalFilename(askboard.getOriginalFilename())
                .savedFilename(askboard.getSavedFilename())
                .askPwd(askboard.getAskPwd())
                .replyStatus(askboard.getReplyStatus())
                .reply(askboard.getReply())
                .build());
        return list;
    }

    /**
     * 글 등록
     *
     * @param askBoardDTO
     */
    public void insertAskBoard(AskBoardDTO askBoardDTO) {
        // 진짜 코드
        String originalFilename = null;
        String savedFilename = null;

        // 첨부파일 있는 경우 파일명 세팅
        // uploadPath = application.properties 에 파일 저장 위치 설정해야 함 그 다음 위에 @Value로 선언
        if (!askBoardDTO.getUploadFile().isEmpty()) {
            originalFilename = askBoardDTO.getUploadFile().getOriginalFilename();
            savedFilename = FileService.saveFile(askBoardDTO.getUploadFile(),
                    uploadPath);

            askBoardDTO.setOriginalFilename(originalFilename);
            askBoardDTO.setSavedFilename(savedFilename);
        }
        AskBoardEntity askBoardEntity = AskBoardEntity.toEntity(askBoardDTO);

        askBoardRepository.save(askBoardEntity);
    }

    /**
     * 하나의 게시글을 조회하는 기능
     * 
     * static 제외 -> spring에서 지원하는 auto 인데 static으로 정의하려고 해서 오류 발생
     */
    public AskBoardDTO checkOne(Long askSeq) {

        Optional<AskBoardEntity> temp = askBoardRepository.findById(askSeq);

        AskBoardDTO askBoardDTO = null;

        if (temp.isPresent()) {
            AskBoardEntity entity = temp.get();
            askBoardDTO = AskBoardDTO.toDTO(entity);
        }
        return askBoardDTO;
    }

    public void deleteOne(Long askSeq) {
        Optional<AskBoardEntity> temp = askBoardRepository.findById(askSeq);

        if (!temp.isPresent())
            return;

        // AskBoardEntity askBoardEntity
    }

}
