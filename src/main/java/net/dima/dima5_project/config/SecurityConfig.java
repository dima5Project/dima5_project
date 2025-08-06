package net.dima.dima5_project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.handler.CustomLogoutSuccessHandler;

@Configuration // 이 파일이 설정파일임을 알려주는 어노테이션
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        // private final CustomLoginSuccessHandler loginSuccessHandler;
        // private final LoginFailureHandler loginFailureHandler;
        private final CustomLogoutSuccessHandler logoutSuccessHandler; // LogoutSuccessHandler은 이미있는 객체이므로 커스텀

        @Bean // 해당 메소드에서 사용, 반환하는 값을 Bean으로 관리
        SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                // 경로 설정
                http.authorizeHttpRequests((auth) ->
                // role 에 따라 권한이 달라짐
                auth
                                .requestMatchers(
                                                "/",
                                                "/main",
                                                "/map",
                                                "/intro/init",
                                                "/user/login",
                                                "/user/join",
                                                "/user/joinProc",
                                                "/user/confirmId",
                                                "/news/main",
                                                "/api/port/**",

                                                "/mypage/**",
                                                "/images/**", // static/../ 안의 하위 디렉토리 접근 가능하도록
                                                "/js/**",
                                                "/css/**")
                                .permitAll() // 모든 사람들에게 주어지는 경로
                                // .requestMatchers("/admin/**").hasRole("ADMIN") // 관리자만
                                // .requestMatchers("/my/**").hasAnyRole("ADMIN", "USER")
                                .anyRequest().authenticated() // 가장 마지막에. 기타 다른 경로는 로그인해야 접근 가능
                );

                // security가 제공하는 기본 폼을 사용하지 않고, 개발자가 만든 폼 사용
                // 시큐리티가 받아서 처리하는 파라미터는 userid, userpwd 인데,
                http
                                .formLogin((auth) -> auth
                                                .loginPage("/user/login") // 로그인 없이 특정페이지에 접속을 시도하면 무조건 로그인 페이지로 이동 =
                                                                          // redirect
                                                .loginProcessingUrl("/user/loginProc") // 로그인 화면에서 로그인 버튼을 클릭하면 시큐리티가
                                                                                       // 받아서 처리(컨트롤러에서는 처리하지 않음)
                                                .usernameParameter("userId") // security가 사용하는 파라미터 대신 개발자가 설정한 파라미터 사용
                                                .passwordParameter("userPwd")
                                                // .defaultSuccessUrl("/") // 로그인 성공 시 루트로 이동
                                                // .successHandler(loginSuccessHandler) // 로그인 성공시 처리할 핸들러 등록
                                                // .failureHandler(loginFailureHandler) // 로그인 실패시 처리할 핸들러 등록
                                                // .failureUrl("/login?error=true") // 로그인 에러가 나면 다시 로그인 페이지로 이동, 에러를
                                                // 파라미터로 설정
                                                .permitAll());

                // 로그아웃에 대한 처리
                http
                                .logout((auth) -> auth
                                                .logoutUrl("/user/logout") // 로그아웃 요청 url
                                                .logoutSuccessHandler(logoutSuccessHandler) // 로그아웃 성공시 처리할 핸들러 등록
                                                // .logoutSuccessUrl("/") // 로그아웃 성공 시 url
                                                .invalidateHttpSession(true) // 세션 무효화
                                                .clearAuthentication(true) // 인증기록 무효화
                                );

                // Post는 무조건 토큰을 전달해야 함. disabled 시키면 토큰 전달할 필요없음.
                // 시큐리티는 사이트 위변조를 방어하도록 설정되어 있음
                // 개발할 때는 위변조 방어(CSRF 공격)를 disable하고 배포할 때 enabled 시킴
                http
                                .csrf((auth) -> auth.disable());

                return http.build();
        }

        // 암호화 (비밀번호를 암호화)
        // 양방향(공개키 암호화), 단방향(비밀키 암호화)
        @Bean
        BCryptPasswordEncoder bPasswordEncoder() {
                return new BCryptPasswordEncoder();
        }

}
