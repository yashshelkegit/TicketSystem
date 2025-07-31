package com.example.mts.service;

import com.example.mts.dto.RegisterRequest;
import com.example.mts.model.Department;
import com.example.mts.model.Ticket;
import com.example.mts.model.User;
import com.example.mts.model.enums.Role;
import com.example.mts.repository.DepartmentRepository;
import com.example.mts.repository.TicketRepository;
import com.example.mts.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        // Create dummy data
        if (userRepository.count() == 0) {
            User citizen = new User();
            citizen.setUsername("citizen1");
            citizen.setPassword(passwordEncoder.encode("password"));
            citizen.setRole(com.example.mts.model.enums.Role.CITIZEN);
            citizen.setName("John Doe");
            userRepository.save(citizen);

            User staff = new User();
            staff.setUsername("staff1");
            staff.setPassword(passwordEncoder.encode("password"));
            staff.setRole(com.example.mts.model.enums.Role.STAFF);
            staff.setName("Jane Smith");
            staff.setDepartment("SANITATION");
            userRepository.save(staff);

            User collector = new User();
            collector.setUsername("collector1");
            collector.setPassword(passwordEncoder.encode("password"));
            collector.setRole(com.example.mts.model.enums.Role.COLLECTOR);
            collector.setName("Alice Brown");
            userRepository.save(collector);

            User admin = new User();
            admin.setUsername("admin1");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setRole(com.example.mts.model.enums.Role.ADMIN);
            admin.setName("Bob White");
            userRepository.save(admin);
        }

        if (departmentRepository.count() == 0) {
            Department sanitation = new Department();
            sanitation.setId("SANITATION");
            sanitation.setName("Sanitation Department");
            departmentRepository.save(sanitation);

            Department water = new Department();
            water.setId("WATER_SUPPLY");
            water.setName("Water Supply Department");
            departmentRepository.save(water);

            Department electricity = new Department();
            electricity.setId("ELECTRICITY");
            electricity.setName("Electricity Department");
            departmentRepository.save(electricity);
        }

        if (ticketRepository.count() == 0) {
            Optional<User> citizenOpt = userRepository.findByUsername("citizen1");
            citizenOpt.ifPresent(citizen -> {
                Ticket ticket1 = new Ticket();
                ticket1.setTitle("Streetlight not working");
                ticket1.setDescription("Streetlight near main park is not working for a week.");
                ticket1.setCategory("STREETLIGHTS");
                ticket1.setPriority(com.example.mts.model.enums.Priority.HIGH);
                ticket1.setLocation("Main Park, Sector 10");
                ticket1.setDepartment("ELECTRICITY");
                ticket1.setCreatedBy(citizen.getId());
                ticket1.setCreatedByName(citizen.getName());
                createTicket(ticket1);

                Ticket ticket2 = new Ticket();
                ticket2.setTitle("Garbage not collected");
                ticket2.setDescription("Garbage has not been collected from our area for 3 days.");
                ticket2.setCategory("SANITATION");
                ticket2.setPriority(com.example.mts.model.enums.Priority.MEDIUM);
                ticket2.setLocation("Block C, Apartment 5");
                ticket2.setDepartment("SANITATION");
                ticket2.setCreatedBy(citizen.getId());
                ticket2.setCreatedByName(citizen.getName());
                createTicket(ticket2);
            });
        }
    }

    public Optional<User> login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return userOpt;
        }
        return Optional.empty();
    }

    public Optional<User> registerUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return Optional.empty(); // Username already exists
        }
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setName(request.getName());
        newUser.setRole(Role.CITIZEN); // Default role for new registrations
        return Optional.of(userRepository.save(newUser));
    }

    public Ticket createTicket(Ticket ticket) {
        ticket.setTicketNumber("TKT" + System.currentTimeMillis());
        ticket.setStatus(com.example.mts.model.enums.TicketStatus.OPEN);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public Optional<Ticket> updateTicketStatus(Long id, com.example.mts.model.enums.TicketStatus status) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();
            ticket.setStatus(status);
            ticket.setUpdatedAt(LocalDateTime.now());
            return Optional.of(ticketRepository.save(ticket));
        }
        return Optional.empty();
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getTicketsByUserId(Long userId) {
        return ticketRepository.findByCreatedBy(userId);
    }

    public List<Ticket> getTicketsByDepartment(String department) {
        return ticketRepository.findByDepartment(department);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public Optional<Department> updateDepartment(String id, String newName) {
        Optional<Department> deptOpt = departmentRepository.findById(id);
        if (deptOpt.isPresent()) {
            Department department = deptOpt.get();
            department.setName(newName);
            return Optional.of(departmentRepository.save(department));
        }
        return Optional.empty();
    }

    public boolean deleteDepartment(String id) {
        if (departmentRepository.existsById(id)) {
            departmentRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> updateUserRole(Long userId, Role newRole) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(newRole);
            return Optional.of(userRepository.save(user));
        }
        return Optional.empty();
    }

    // New method to update a user's department
    public Optional<User> updateUserDepartment(Long userId, String newDepartmentId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // You might want to add validation here to ensure newDepartmentId exists
            // For now, we'll allow setting it directly, including null/empty for no department
            user.setDepartment(newDepartmentId);
            return Optional.of(userRepository.save(user));
        }
        return Optional.empty();
    }
}