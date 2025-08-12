package net.dima.dima5_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class IntroduceController {

    @GetMapping("/intro/service")
    public String introduce() {
        return "introduce";
    }

    @GetMapping("/intro/team")
    public String introTeam() {
        return "introTeam";
    }
}