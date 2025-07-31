package com.example.mts.model;

import com.example.mts.model.enums.Role;
import lombok.Data;
import jakarta.persistence.*;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;
    @Enumerated(EnumType.STRING)
    private Role role;
    private String name;
    private String department;
}