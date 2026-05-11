package com.realestate.management.repository;

import com.realestate.management.entity.Notification;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser(User user);
    
    List<Notification> findByUserAndIsRead(User user, Boolean isRead);
    
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    long countByUserAndIsRead(User user, Boolean isRead);
}
