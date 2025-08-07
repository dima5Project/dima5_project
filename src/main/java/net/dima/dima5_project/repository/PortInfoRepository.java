package net.dima.dima5_project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortInfoEntity;

@Repository
public interface PortInfoRepository extends JpaRepository<PortInfoEntity, String> {

}