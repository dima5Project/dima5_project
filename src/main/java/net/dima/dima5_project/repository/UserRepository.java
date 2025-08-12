package net.dima.dima5_project.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.PredictUserEntity;

public interface UserRepository extends JpaRepository<PredictUserEntity, Long> {
    // ✅ 사용자 아이디 중복 확인
    boolean existsByUserId(String userId);

    // ✅ 사용자 아이디로 사용자 정보 조회
    Optional<PredictUserEntity> findByUserId(String userId);

    // ✅ 본인(userId) 제외하고 같은 이메일이 있는지 체크
    boolean existsByUserEmailAndUserIdNot(String userEmail, String userId);

}
