package net.dima.dima5_project.service;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.dto.PredictUserDTO;
import net.dima.dima5_project.dto.ResultSaveDTO;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.repository.ResultSaveRepository;
import net.dima.dima5_project.repository.UserRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder; // 암호화
    private final ResultSaveRepository resultSaveRepository;
    private final AskBoardRepository askBoardRepository;

    /**
     * 회원가입 처리
     * 
     * @param userDTO
     */
    public boolean join(PredictUserDTO userDTO) {
        log.info("회원가입 요청: {}", userDTO.toString());

        // 해당 아이디가 있는지 체크
        if (repository.existsByUserId(userDTO.getUserId()))
            return false;

        userDTO.setUserRole("ROLE_USER");

        // 비밀번호를 암호화하여 다시 세팅
        userDTO.setUserPwd(bCryptPasswordEncoder.encode(userDTO.getUserPwd()));

        // dto -> entity로 수정
        PredictUserEntity userEntity = PredictUserEntity.toEntity(userDTO);

        repository.save(userEntity);

        return true;
    }

    /**
     * 전달받은 userId에 해당하는 사용자 정보를 조회
     * 
     * @param
     */
    public PredictUserDTO selectOne(String userId) {
        Optional<PredictUserEntity> temp = repository.findByUserId(userId);
        PredictUserDTO dto = null;

        if (temp.isPresent()) {
            dto = PredictUserDTO.toDTO(temp.get());
        }
        log.info("아이디 검색: {}", dto);

        return dto;
    }

    /**
     * 로그인 사용자 비밀번호 재확인
     * DB에서 사용자 조회후, 입력한 비번과 저장된 해시를 비교해 true/false 반환
     * 
     * @param userId
     * @param rawPwd
     * @return
     */
    @Transactional
    public boolean verifyPassword(String userId, String rawPwd) {
        PredictUserEntity predictUserEntity = repository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return bCryptPasswordEncoder.matches(rawPwd, predictUserEntity.getUserPwd());
    }

    /**
     * 프로필 정보(이메일/이름/유형) 부분 업데이트
     * null이 아닌 값만 trim 후 반영
     * 
     * @param userId
     * @param email
     * @param name
     * @param type
     */
    @Transactional
    public void updateProfile(String userId, String email, String name, String type) {
        PredictUserEntity predictUserEntity = repository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (email != null)
            predictUserEntity.setUserEmail(email.trim());
        if (name != null)
            predictUserEntity.setUserName(name.trim());
        if (type != null)
            predictUserEntity.setUserType(type.trim());
    }

    /**
     * 비밀번호 변경
     * 새 비밀번호를 BCrypt로 해시해서 저장
     * 트랜젝션 조율 시점에 변경 감지로 자동 커밋
     * 
     * @param userId
     * @param newRawPwd
     */
    @Transactional
    public void updatePassword(String userId, String newRawPwd) {
        PredictUserEntity entity = repository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        entity.setUserPwd(bCryptPasswordEncoder.encode(newRawPwd));
    }

    /**
     * 여기서 부터는 마이페이지 연동을 위한 작업
     * 
     * @param userId
     * @return
     */
    public PredictUserDTO getProfile(String userId) {

        return selectOne(userId); // 자기 메서드 직접 호출
    }

    public Page<ResultSaveDTO> getMySaves(String userId, Pageable pageable) {
        return resultSaveRepository
                .findByUserId_UserId(userId, pageable)
                .map(ResultSaveDTO::toDTO);
    }

    public Page<AskBoardDTO> getMyAsks(String userId, Pageable pageable) {
        return askBoardRepository
                .findByWriter_UserIdOrderByCreateDateDesc(userId, pageable)
                .map(AskBoardDTO::toDTO);
    }

    public boolean isEmailTakenByOther(String currentUserId, String email) {
        return repository.existsByUserEmailAndUserIdNot(email, currentUserId);
    }

}
