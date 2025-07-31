package net.dima.dima5_project.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.PredictUserEntity;

public interface UserRepository extends JpaRepository<PredictUserEntity, Long>{
    
}
