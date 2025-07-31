package com.example.mts.repository;

import com.example.mts.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreatedBy(Long userId);
    List<Ticket> findByDepartment(String department);
}
