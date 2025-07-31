package com.example.mts.controller;

import com.example.mts.dto.LoginRequest;
import com.example.mts.dto.RegisterRequest;
import com.example.mts.model.Department;
import com.example.mts.model.Ticket;
import com.example.mts.model.User;
import com.example.mts.model.enums.Role;
import com.example.mts.model.enums.TicketStatus;
import com.example.mts.service.AppService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final AppService appService;

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> user = appService.login(loginRequest.getUsername(), loginRequest.getPassword());
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest registerRequest) {
        Optional<User> newUser = appService.registerUser(registerRequest);
        return newUser.map(user -> ResponseEntity.status(HttpStatus.CREATED).body(user))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT).build());
    }

    @PostMapping("/tickets")
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        return ResponseEntity.ok(appService.createTicket(ticket));
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(@PathVariable Long id, @RequestBody String status) {
        try {
            String cleanStatus = status.replaceAll("\"", "");
            TicketStatus ticketStatus = TicketStatus.valueOf(cleanStatus);
            Optional<Ticket> updatedTicket = appService.updateTicketStatus(id, ticketStatus);
            return updatedTicket.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<Ticket>> getTickets(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String department
    ) {
        if (userId != null) {
            return ResponseEntity.ok(appService.getTicketsByUserId(userId));
        }
        if (department != null) {
            return ResponseEntity.ok(appService.getTicketsByDepartment(department));
        }
        return ResponseEntity.ok(appService.getAllTickets());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        return ResponseEntity.ok(appService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appService.createDepartment(department));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<Department> updateDepartment(@PathVariable String id, @RequestBody Department department) {
        Optional<Department> updatedDept = appService.updateDepartment(id, department.getName());
        return updatedDept.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable String id) {
        if (appService.deleteDepartment(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(appService.getAllUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody String role) {
        try {
            String cleanRole = role.replaceAll("\"", "");
            Role newRole = Role.valueOf(cleanRole);
            Optional<User> updatedUser = appService.updateUserRole(id, newRole);
            return updatedUser.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // New endpoint to update a user's department
    @PutMapping("/users/{id}/department")
    public ResponseEntity<User> updateUserDepartment(@PathVariable Long id, @RequestBody String departmentId) {
        try {
            String cleanDepartmentId = departmentId.replaceAll("\"", "");
            Optional<User> updatedUser = appService.updateUserDepartment(id, cleanDepartmentId.isEmpty() ? null : cleanDepartmentId);
            return updatedUser.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            // Catch broader exceptions for department validation if not found or other issues
            return ResponseEntity.badRequest().build();
        }
    }
}