package com.realestate.management.aspect;

import com.realestate.management.entity.AuditLog;
import com.realestate.management.entity.User;
import com.realestate.management.repository.AuditLogRepository;
import com.realestate.management.repository.UserRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
public class AuditLogAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @AfterReturning(pointcut = "@annotation(com.realestate.management.aspect.AuditAction)", returning = "result")
    public void logAfter(JoinPoint joinPoint, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AuditAction auditAction = method.getAnnotation(AuditAction.class);

        User currentUser = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        }

        String actionType = auditAction.actionType();
        String description = auditAction.description() + " (Method: " + method.getName() + ")";

        AuditLog log = new AuditLog();
        log.setAction(actionType + " - " + description);
        if (currentUser != null) {
            log.setActorId(currentUser.getUserId());
            log.setActorRole(currentUser.getRole());
        }
        log.setEntityType("UNKNOWN");
        log.setEntityId(0L);
        auditLogRepository.save(log);
    }
}
