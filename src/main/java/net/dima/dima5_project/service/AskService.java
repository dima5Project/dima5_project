package net.dima.dima5_project.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.couchbase.CouchbaseProperties.Authentication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.dto.LoginUserDetailsDTO;
import net.dima.dima5_project.entity.AskBoardEntity;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.repository.PredictUserRepository;
import net.dima.dima5_project.repository.UserRepository;
import net.dima.dima5_project.util.FileService;

@Service
@Slf4j
@RequiredArgsConstructor
public class AskService {

    private final AskBoardRepository askBoardRepository;
    private final PredictUserRepository predictUserRepository;

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
    // public Page<AskBoardDTO> selectAll(Pageable pageable, String searchItem,
    // String searchWord) {
    // // 페이징을 위한 사전 작업
    // int page = pageable.getPageNumber();

    // // 검색어 + 페이징 이용한 조회
    // Page<AskBoardEntity> temp = null;
    // Page<AskBoardDTO> list = null;

    // switch (searchItem) {
    // case "askTitle":
    // temp = askBoardRepository.findByAskTitleContains(
    // searchWord,
    // PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "askSeq")));
    // break;

    // case "writer":
    // temp = askBoardRepository.findByWriterContains(
    // searchWord,
    // PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "askSeq")));
    // break;

    // case "askContent":
    // temp = askBoardRepository.findByAskContentContains(
    // searchWord,
    // PageRequest.of(page, pageLimit, Sort.by(Sort.Direction.DESC, "askSeq")));
    // break;
    // }

    // list = temp.map((askboard) -> AskBoardDTO.builder()
    // .askSeq(askboard.getAskSeq())
    // .askType(askboard.getAskType())
    // .askTitle(askboard.getAskTitle())
    // .askContent(askboard.getAskContent())
    // .writer(askboard.getWriter())
    // .createDate(askboard.getCreateDate())
    // .originalFilename(askboard.getOriginalFilename())
    // .savedFilename(askboard.getSavedFilename())
    // .askPwd(askboard.getAskPwd())
    // .replyStatus(askboard.getReplyStatus())
    // .reply(askboard.getReply())
    // .build());
    // return list;
    // }

    // 실험
    public Page<AskBoardDTO> selectAll(Pageable pageable, String item, String word) {
        String keyword = (word == null) ? "" : word.trim();
        Page<AskBoardEntity> page;

        if (keyword.isEmpty()) {
            // 검색어 없으면 전체 조회
            page = askBoardRepository.findAll(pageable);
        } else {
            switch (item) {
                case "askTitle" -> // 제목
                    page = askBoardRepository.findByAskTitleContains(keyword, pageable);
                case "writer" -> // 작성자 ID
                    page = askBoardRepository.findByWriter_UserIdContains(keyword, pageable);
                case "all" -> // 제목 + 작성자 ID
                    page = askBoardRepository.findByAskTitleContainsOrWriter_UserIdContains(keyword, keyword, pageable);
                default -> // 잘못된 값이면 전체
                    page = askBoardRepository.findAll(pageable);
            }
        }
        return page.map(AskBoardDTO::toDTO);
    }

    /**
     * 글 등록
     *
     * @param askBoardDTO
     */
    // public void insertAskBoard(AskBoardDTO askBoardDTO) {
    // // 진짜 코드
    // String originalFilename = null;
    // String savedFilename = null;

    // // 첨부파일 있는 경우 파일명 세팅
    // // uploadPath = application.properties 에 파일 저장 위치 설정해야 함 그 다음 위에 @Value로 선언
    // if (!askBoardDTO.getUploadFile().isEmpty()) {
    // originalFilename = askBoardDTO.getUploadFile().getOriginalFilename();
    // savedFilename = FileService.saveFile(askBoardDTO.getUploadFile(),
    // uploadPath);

    // askBoardDTO.setOriginalFilename(originalFilename);
    // askBoardDTO.setSavedFilename(savedFilename);
    // }

    // // 비밀번호(4자리 숫자 문자열) 처리: 비어있으면 공개글(null로 저장) -> 확인해야 함
    // if (askBoardDTO.getAskPwd() != null && !askBoardDTO.getAskPwd().isBlank()) {
    // String pwd = askBoardDTO.getAskPwd().trim();
    // if (!pwd.matches("^\\d{4}$")) {
    // throw new IllegalArgumentException("비밀번호는 숫자 4자리여야 합니다.");
    // }
    // askBoardDTO.setAskPwd(pwd);
    // } else {
    // askBoardDTO.setAskPwd(null);
    // }

    // AskBoardEntity askBoardEntity = AskBoardEntity.toEntity(askBoardDTO);

    // askBoardRepository.save(askBoardEntity);
    // }

    @Transactional
    public void insertAskBoard(AskBoardDTO dto) {
        // 1) 로그인 사용자
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // (A) 로그인 필수라면:
            throw new IllegalStateException("로그인 후 작성해주세요.");
            // (B) 익명 허용하려면 위 throw 대신 다음처럼:
            // dto.setWriter(null);
        } else {
            String userId = (auth.getPrincipal() instanceof LoginUserDetailsDTO u) ? u.getUserId() : auth.getName();
            PredictUserEntity writer = predictUserRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalStateException("사용자 정보를 찾을 수 없습니다: " + userId));
            dto.setWriter(writer);
        }

        // 2) 파일 저장
        MultipartFile f = dto.getUploadFile();
        if (f != null && !f.isEmpty()) {
            dto.setOriginalFilename(f.getOriginalFilename());
            String saved = FileService.saveFile(f, uploadPath); // ★ 저장
            dto.setSavedFilename(saved);
        } else {
            dto.setOriginalFilename(null);
            dto.setSavedFilename(null);
        }

        // 3) 공개글이면 비번 제거
        if (dto.getAskPwd() != null && dto.getAskPwd().isBlank()) {
            dto.setAskPwd(null);
        }

        askBoardRepository.save(AskBoardEntity.toEntity(dto));
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

    /**
     * 하나의 게시글 삭제
     * 
     * @param askSeq
     */
    public void deleteOne(Long askSeq) {
        Optional<AskBoardEntity> temp = askBoardRepository.findById(askSeq);

        if (!temp.isPresent())
            return;

        AskBoardEntity askBoardEntity = temp.get();
        String savedFilename = askBoardEntity.getSavedFilename();

        // 글이 삭제되면서 첨부파일도 삭제함
        if (savedFilename != null) {
            String fullPath = uploadPath + "/" + savedFilename;
            FileService.deleteFile(fullPath);
        }
        askBoardRepository.deleteById(askSeq);
    }

    /**
     * 비밀번호 검증 메소드
     * 
     * @param askSeq
     * @param pwd
     * @return
     */
    public boolean verifyPassword(Long askSeq, String pwd) {
        AskBoardDTO ask = checkOne(askSeq);
        if (ask == null)
            return false;

        if (ask.getAskPwd() == null || ask.getAskPwd().isBlank()) {
            return true;
        }

        return ask.getAskPwd().equals(pwd.trim());
    }

}
