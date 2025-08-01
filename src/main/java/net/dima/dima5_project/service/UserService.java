package net.dima.dima5_project.service;

import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PredictUserDTO;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.repository.UserRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder; // 암호화

    /**
     * 회원가입 처리
     * 
     * @param userDTO
     */
    public boolean join(PredictUserDTO userDTO) {
        log.info("회원가입 처리되는지?: {}", userDTO.toString());

        // 해당 아이디가 있는지 체크
        boolean isExistUser = repository.existsByUserId(userDTO.getUserId());
        if (isExistUser)
            return false; // 이것은 if의 return문

        // 비밀번호를 암호화하여 다시 세팅
        userDTO.setUserPwd(bCryptPasswordEncoder.encode(userDTO.getUserPwd()));

        // dto -> entity로 수정
        PredictUserEntity userEntity = PredictUserEntity.toEntity(userDTO);

        repository.save(userEntity);

        return false;
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
        return null;
    }

}
