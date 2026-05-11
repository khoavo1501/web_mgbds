package com.realestate.management.repository;

import com.realestate.management.entity.Appointment;
import com.realestate.management.entity.Property;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByCustomer(User customer);
    
    List<Appointment> findByBroker(User broker);
    
    List<Appointment> findByProperty(Property property);
    
    List<Appointment> findByStatus(String status);
    
    List<Appointment> findByBrokerAndStatus(User broker, String status);
    
    List<Appointment> findByCustomerAndStatus(User customer, String status);
    
    List<Appointment> findByScheduledAtBetween(LocalDateTime start, LocalDateTime end);
}
