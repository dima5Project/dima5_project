package net.dima.dima5_project.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.LoginUserDetailsDTO;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.repository.UserRepository;

// Security가 제공 로그인 전용 Service 클래스

@RequiredArgsConstructor
@Service
@Slf4j
public class LoginUserDetailsService implements UserDetailsService {

    private final UserRepository repository;  // 레파지토리에서 데이터를 가져와야

    //로그인 시, 아이디/비번 잘못 입력할 때 발생하는 예외처리
    @Override
    public UserDetails loadUserByUsername(String userId)
            throws UsernameNotFoundException { 

        // userId userPwd가 같아야 로그인 
        PredictUserEntity temp = repository.findByUserId(userId)
                .orElseThrow(() -> {                            // -> id를 못 찾을 경우에 예외처리
                    throw new UsernameNotFoundException("존재하지 않는 아이디입니다.");
                });

        System.out.println(temp.toString());
        
        LoginUserDetailsDTO userDTO = LoginUserDetailsDTO.toDTO(temp); // 아버지가 UserDetails
        
        return userDTO;
    }
}
