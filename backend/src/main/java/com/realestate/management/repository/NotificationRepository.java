package com.realestate.management.repository;

import com.realestate.management.entity.Notification;
import com.realestate.management.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser(User user);
    
    Page<Notification> findByUser(User user, Pageable pageable);
    
    List<Notification> findByUserAndIsRead(User user, Boolean isRead);
    
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    long countByUserAndIsRead(User user, Boolean isRead);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.userId = :userId AND n.isRead = false")
    void markAllAsReadByUser(@Param("userId") Long userId);
}
