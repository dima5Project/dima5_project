// package net.dima.dima5_project.handler;

// import java.io.IOException;
// import java.util.ArrayList;
// import java.util.List;

// import org.springframework.stereotype.Component;

// import jakarta.servlet.ServletException;
// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import jakarta.servlet.http.HttpSession;
// import lombok.extern.slf4j.Slf4j;

// @Component // LoginSuccessHandler을 객체로 만들어 주기 위함 -> bin
// @Slf4j
// public class LoginSuccessHandler implements AuthenticationSuccessHandler {

//     @Override
//     public void onAuthenticationSuccess(
//             HttpServletRequest request, 
//             HttpServletResponse response,
//             Authentication authentication) throws IOException, ServletException {
        
//         // 한 명의 유저가 여러 Role 정보를 가질 수 있으므로 ArrayList로 처리
//         List<String> roleNames = new ArrayList<>();

//         authentication.getAuthorities().forEach((auth) -> 
//                 roleNames.add(auth.getAuthority()));         // Collection으로 반환하므로 forEach 사용 O

//         // 만약, roleNames 의 정보 중, ROLE_ADMIN을 포함한 계정이 admin 페이지로 이동하도록 설정 가능
//         if(roleNames.contains("ROLE_ADMIN")) {
//             response.sendRedirect("/admin/adminpage"); // 현재는 페이지가 없으므로 오류
//         }
        
//         // http 세션 정보("session"): 사용자의 정보를 서버 측에 저장하는 메모리 공간
//         // 브라우저 하나 당 세션 하나 (엣지 하나, 크롬 하나)
//         HttpSession session = request.getSession();
//         String refererUrl = (String) session.getAttribute("refererUrl"); // Object로 반환하고 String으로 받음

//         log.info("로그인 성공: {}", refererUrl);
//         response.sendRedirect(refererUrl);
//     }

// }
