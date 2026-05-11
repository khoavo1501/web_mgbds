package com.realestate.management.repository;

import com.realestate.management.entity.Lead;
import com.realestate.management.entity.Property;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByStatus(String status);
    
    List<Lead> findByAssignedTo(User assignedTo);
    
    List<Lead> findByProperty(Property property);
    
    List<Lead> findByAssignedToAndStatus(User assignedTo, String status);
    
    List<Lead> findByCustomerPhone(String customerPhone);
}
