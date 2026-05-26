package com.realestate.management.service;

import com.realestate.management.entity.AuditLog;
import com.realestate.management.entity.User;
import com.realestate.management.repository.AuditLogRepository;
import com.realestate.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void log(String beforeStatus, String afterStatus, String action, String entityType, Long entityId) {
        AuditLog log = new AuditLog();
        log.setBeforeStatus(beforeStatus);
        log.setAfterStatus(afterStatus);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getPrincipal().equals("anonymousUser")) {
            User user = userRepository.findByEmail(auth.getName()).orElse(null);
            if (user != null) {
                log.setActorId(user.getUserId());
                log.setActorRole(user.getRole());
            }
        }

        auditLogRepository.save(log);
    }
}
