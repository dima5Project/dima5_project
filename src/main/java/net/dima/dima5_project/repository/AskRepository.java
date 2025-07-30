package net.dima.dima5_project.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.AskBoardEntity;

public interface AskRepository extends JpaRepository<AskBoardEntity, Integer> {

}
