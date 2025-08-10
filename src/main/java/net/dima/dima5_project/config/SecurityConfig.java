package net.dima.dima5_project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.handler.CustomLoginFailureHandler;
import net.dima.dima5_project.handler.CustomLoginSuccessHandler;
import net.dima.dima5_project.handler.CustomLogoutSuccessHandler;

@Configuration // 이 파일이 설정파일임을 알려주는 어노테이션
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final CustomLoginSuccessHandler loginSuccessHandler;
        private final CustomLoginFailureHandler loginFailureHandler;
        private final CustomLogoutSuccessHandler logoutSuccessHandler; // LogoutSuccessHandler은 이미있는 객체이므로 커스텀

        @Bean // 해당 메소드에서 사용, 반환하는 값을 Bean으로 관리
        SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                // 경로 설정
                http.authorizeHttpRequests((auth) ->
                // role 에 따라 권한이 달라짐
                auth
                                .requestMatchers(
                                                "/",
                                                "/api/**",
                                                "/lang",
                                                "/main",
                                                "/intro/**",        // 소개
                                                "/ask/**",          // 문의 - 나중에 삭제
                                                "/predict/**",      // 차항지 예측 - 나중에 삭제
                                                "/user/**",
                                                "/news/**",         // 뉴스
                                                "/api/port/**",
                                                "/mypage/**",       // 마이페이지 - 나중에 삭제
                                                "/images/**",
                                                "/css/**",
                                                "/js/**",
                                                "/api/info/**",     // 부가정보 - 나중에 삭제
                                                "/port/info/**",
                                                "/info/**"          // 부가정보 - 나중에 삭제
                                ).permitAll() // 모든 사람들에게 주어지는 경로
                                // .requestMatchers("/admin/**").hasRole("ADMIN") // 관리자만
                                .anyRequest().authenticated() // 기타 다른 경로는 로그인해야 접근 가능
                );

                // 로그인에 대한 처리
                http
                                .formLogin((auth) -> auth
                                                .loginPage("/user/login") // 로그인 없이 특정페이지에 접속을 시도하면 무조건 로그인 페이지로 이동 =
                                                .loginProcessingUrl("/user/loginProc") // 로그인 화면에서 로그인 버튼을 클릭하면 시큐리티가
                                                                                       // 받아서 처리
                                                .usernameParameter("userId") // security가 사용하는 파라미터 대신 개발자가 설정한 파라미터 사용
                                                .passwordParameter("userPwd")
                                                .defaultSuccessUrl("/") // 로그인 성공 시 루트로 이동
                                                .successHandler(loginSuccessHandler) // 로그인 성공시 처리할 핸들러 등록
                                                .failureHandler(loginFailureHandler) // 로그인 실패시 처리할 핸들러 등록
                                                .failureUrl("/user/login?error=true") // 로그인 에러가 나면 다시 로그인 페이지로 이동, 에러를
                                                                                      // 파라미터로 설정
                                                .permitAll());

                // 로그아웃에 대한 처리
                http
                                .logout((auth) -> auth
                                                .logoutUrl("/user/logout") // 로그아웃 요청 url
                                                .logoutSuccessHandler(logoutSuccessHandler) // 로그아웃 성공시 처리할 핸들러 등록
                                                .logoutSuccessUrl("/") // 로그아웃 성공 시 url
                                                .invalidateHttpSession(true) // 세션 무효화
                                                .clearAuthentication(true) // 인증기록 무효화
                                );

                // Post는 무조건 토큰을 전달해야 함. disabled 시키면 토큰 전달할 필요없음.
                http
                                .csrf((auth) -> auth.disable());

                return http.build();
        }

        // 암호화 (비밀번호를 암호화)
        @Bean
        BCryptPasswordEncoder bPasswordEncoder() {
                return new BCryptPasswordEncoder();
        }

}
