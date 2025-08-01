package net.dima.dima5_project.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PortPredictDTO;
import net.dima.dima5_project.dto.PredictResultSaveDTO;
import net.dima.dima5_project.entity.PortPredictEntity;
import net.dima.dima5_project.entity.PortPsoEntity;
import net.dima.dima5_project.service.PortPredictService;

@RestController // 데이터를 반환하는 API 전용 컨트롤러
@RequestMapping("/api/port")
@RequiredArgsConstructor
@Slf4j
public class PortPredictController {

    private final PortPredictService portPredictService;

    @GetMapping("/pso")
    public List<PortPredictDTO> getPsoData(@ModelAttribute PredictResultSaveDTO predictDTO) {
        log.info("지도에서 보낸 데이터: {}", predictDTO);

        List<PortPredictDTO> list = portPredictService.getUserPso(predictDTO);
        return list;
    }

    @GetMapping("/predict")
    public List<PortPredictEntity> getPredictData() {
        return portPredictService.getAllPredict();
    }

};