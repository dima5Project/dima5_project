package net.dima.dima5_project.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortPredictDTO;
import net.dima.dima5_project.dto.PredictResultSaveDTO;
import net.dima.dima5_project.entity.PortPredictEntity;
import net.dima.dima5_project.entity.PortPsoEntity;
import net.dima.dima5_project.repository.PortPredictRepository;
import net.dima.dima5_project.repository.PortPsoRepositroy;

@Service
@RequiredArgsConstructor

public class PortPredictService {

    private final PortPsoRepositroy portPsoRepositroy;
    private final PortPredictRepository portPredictRepository;

    public List<PortPsoEntity> getAllPso() {
        return portPsoRepositroy.findAll();
    }

    public List<PortPredictEntity> getAllPredict() {
        return portPredictRepository.findAll();
    }

    /**
     * 사용자가 입력한 정보를 이용해서 데이터를 질의한 후에 반환
     * 
     * @param predictDTO
     * @return
     */
    public List<PortPredictDTO> getUserPso(PredictResultSaveDTO predictDTO) {
        List<PortPredictEntity> findPosition = portPredictRepository.findByLatAndLon(predictDTO.getLat(),
                predictDTO.getLon());

        List<PortPredictDTO> returnDTO = new ArrayList<>();
        findPosition.forEach((entity) -> returnDTO.add(PortPredictDTO.toDTO(entity)));

        return returnDTO;
    }

}
