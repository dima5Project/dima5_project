package net.dima.dima5_project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortNameEntity;

@Repository
public interface PortNameRepository extends JpaRepository<PortNameEntity, String> {

}
