package com.realestate.management.repository;

import com.realestate.management.entity.Session;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    List<Session> findByUser(User user);
    
    void deleteByUser(User user);
}
