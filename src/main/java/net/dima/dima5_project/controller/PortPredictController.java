package net.dima.dima5_project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import net.dima.dima5_project.entity.PortPredictEntity;
import net.dima.dima5_project.entity.PortPsoEntity;
import net.dima.dima5_project.service.PortPredictService;

@RestController // 데이터를 반환하는 API 전용 컨트롤러
@RequestMapping("/api/port")
public class PortPredictController {

    @Autowired
    private PortPredictService portPredictService;

    @GetMapping("/pso")
    public List<PortPsoEntity> getPsoData() {
        return portPredictService.getAllPso();
    }

    @GetMapping("/predict")
    public List<PortPredictEntity> getPredictData() {
        return portPredictService.getAllPredict();
    }
}
