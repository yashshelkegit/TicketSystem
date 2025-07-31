package com.example.mts.model;

import com.example.mts.model.enums.Priority;
import com.example.mts.model.enums.TicketStatus;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Data
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String ticketNumber;
    private String title;
    private String description;
    private String category;
    @Enumerated(EnumType.STRING)
    private Priority priority;
    private String location;
    private String department;
    @Enumerated(EnumType.STRING)
    private TicketStatus status;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
