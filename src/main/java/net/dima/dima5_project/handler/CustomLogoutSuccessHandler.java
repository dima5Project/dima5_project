package net.dima.dima5_project.handler;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    @Override
    public void onLogoutSuccess(
            HttpServletRequest request, 
            HttpServletResponse response, 
            Authentication authentication) throws IOException, ServletException {
        
        // 로그아웃 후에 이전 페이지에 그대로 머물러 있기 위해 referer 사용
        String refererUrl = request.getHeader("Referer");
        
        log.info("로그아웃 성공: {}", refererUrl);
        
        if(refererUrl != null) {
            response.sendRedirect(refererUrl); // 로그아웃 하기 직전의 페이지로 리다이렉트
        } else {
            response.sendRedirect("/"); // 정보가 없다면 기본 URL(root)로 리다이랙션
        }

    }

}