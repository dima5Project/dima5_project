package net.dima.dima5_project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.handler.CustomLogoutSuccessHandler;

@Configuration // 이 파일이 설정파일임을 알려주는 어노테이션
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        // private final CustomLoginSuccessHandler customLoginSuccessHandler;
        // private final CustomLoginFailureHandler customLoginFailureHandler;
        private final CustomLogoutSuccessHandler customLogoutSuccessHandler;

        @Bean // 해당 메소드에서 사용, 반환하는 값을 Bean으로 관리
        SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                // 경로 설정
                http.authorizeHttpRequests((auth) ->
                // role 에 따라 권한이 달라짐
                auth
                                .requestMatchers(
                                                "/",
                                                "/api/**",
                                                "/main",
                                                "/intro/**",
                                                "/user/**",
                                                "/news/**",
                                                "/port/info/**",
                                                "/info/**",
                                                "/proxy/met/**", // API 끌어오는 ajax 처리
                                                "/data/**",
                                                "/logout",
                                                "/images/**",
                                                "/css/**",
                                                "/js/**",
                                                "/videos/**",
                                                "/admin/**",
                                                "/api/result-save/**",
                                                "/ws-chat/**"
                                ).permitAll() // 모든 사람들에게 주어지는 경로
                                .requestMatchers("/admin/**").hasRole("ADMIN") // 관리자만

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
                                                .defaultSuccessUrl("/", true) // 로그인 성공 시 루트로 이동
                                                // .successHandler(customLoginSuccessHandler) // 로그인 성공시 처리할 핸들러 등록
                                                // .failureHandler(customLoginFailureHandler) // 로그인 실패시 처리할 핸들러 등록
                                                .failureUrl("/user/login?error=true")
                                                .permitAll());

                // 로그아웃에 대한 처리
                http
                                .logout((auth) -> auth
                                                .logoutUrl("/logout") // 로그아웃 요청 url
                                                .logoutSuccessHandler(customLogoutSuccessHandler) // 로그아웃 성공시 처리할 핸들러 등록
                                                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "GET")) // GET
                                                                                                                   // 허용
                                                .logoutSuccessUrl("/") // 로그아웃 성공 메인으로 이동
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
