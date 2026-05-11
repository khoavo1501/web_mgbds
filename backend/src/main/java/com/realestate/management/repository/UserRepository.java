package com.realestate.management.repository;

import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho User Entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm user theo email
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra email đã tồn tại chưa
     */
    boolean existsByEmail(String email);

    /**
     * Tìm user theo role
     */
    List<User> findByRole(String role);

    /**
     * Tìm user theo role và trạng thái active
     */
    List<User> findByRoleAndIsActive(String role, Boolean isActive);

    /**
     * Tìm user theo trạng thái active
     */
    List<User> findByIsActive(Boolean isActive);
}
