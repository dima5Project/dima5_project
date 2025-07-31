package net.dima.dima5_project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import net.dima.dima5_project.entity.PortPredictEntity;
import net.dima.dima5_project.entity.PortPsoEntity;
import net.dima.dima5_project.repository.PortPredictRepository;
import net.dima.dima5_project.repository.PortPsoRepositroy;

@Service
public class PortPredictService {

    @Autowired
    private PortPsoRepositroy portPsoRepositroy;

    @Autowired
    private PortPredictRepository portPredictRepository;

    public List<PortPsoEntity> getAllPso() {
        return portPsoRepositroy.findAll();
    }

    public List<PortPredictEntity> getAllPredict() {
        return portPredictRepository.findAll();
    }
}
