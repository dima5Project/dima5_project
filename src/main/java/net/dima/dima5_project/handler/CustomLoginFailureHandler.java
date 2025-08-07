package net.dima.dima5_project.handler;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CustomLoginFailureHandler implements
        AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {

        // 실패 이유를 request attribute에 저장
        request.setAttribute("error", true);
        request.setAttribute("errMessage", "아이디 또는 비밀번호가 일치하지 않습니다.");

        // 로그인 페이지로 포워딩 (리다이렉트도 가능함)
        request.getRequestDispatcher("/login").forward(request, response);
    }

}
