package net.dima.dima5_project.dto;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PredictUserEntity;

// 로그인 정보를 담는 DTO
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class LoginUserDetailsDTO implements UserDetails {

    // warning 없애기용
    private static final long serialVersionUID = 1L;
    
    private Long userSeq;
    private String userName;
    private String userId;
    private String userPwd;
    private String userEmail;
    private String userType;
    private String userRole;
    
    // 사용자의 권한(Role) 반환
    // SimpleGrantedAuthority : 시큐리티에서 권한을 표현할 때 사용하는 클래스
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(userRole));
    }

    @Override
    public String getPassword() {
        return this.userPwd;
    }

    @Override
    public String getUsername() {
        return this.userId;
    }

    public String getUserName() {
        return this.userName;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // Entity -> DTO
    public static LoginUserDetailsDTO toDTO(PredictUserEntity entity) {
        return LoginUserDetailsDTO.builder()
                .userSeq(entity.getUserSeq())
                .userId(entity.getUserId())
                .userPwd(entity.getUserPwd())
                .userName(entity.getUserName())
                .userEmail(entity.getUserEmail())
                .userType(entity.getUserType())
                .userRole(entity.getUserRole())
                .build();
    }
    
}
