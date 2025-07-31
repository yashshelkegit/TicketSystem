package com.example.mts.model;

import lombok.Data;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
@Data
public class Department {
    @Id
    private String id; // e.g., SANITATION
    private String name; // e.g., Sanitation Department
}
