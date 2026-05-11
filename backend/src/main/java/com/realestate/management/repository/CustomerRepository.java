package com.realestate.management.repository;

import com.realestate.management.entity.Customer;
import com.realestate.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByUser(User user);
    
    List<Customer> findByCustomerType(String customerType);
}
