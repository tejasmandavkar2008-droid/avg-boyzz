package Hackathon.Backened;

import Hackathon.Backened.model.User;
import Hackathon.Backened.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ── REGISTER ──
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody Map<String, String> body) {
        String name     = body.get("name");
        String email    = body.get("email");
        String password = body.get("password");

        if (email == null || password == null || name == null ||
            email.isBlank() || password.isBlank() || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Name, email and password are required."));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email is already registered. Please log in."));
        }

        String hashed = passwordEncoder.encode(password);
        User savedUser = userRepository.save(new User(name, email, hashed));

        String token = jwtUtil.generateToken(email, name);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Account created successfully!");
        response.put("token", token);
        response.put("email", email);
        response.put("name", name);

        return ResponseEntity.ok(response);
    }

    // ── LOGIN ──
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);

        // Email not found
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Email not registered. Please sign up first."));
        }

        User user = userOpt.get();

        // Wrong password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect password. Please try again."));
        }

        String token = jwtUtil.generateToken(email, user.getName());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Login successful!");
        response.put("token", token);
        response.put("email", email);
        response.put("name", user.getName());

        return ResponseEntity.ok(response);
    }

    // ── ME / TOKEN VERIFICATION ──
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("authenticated", false, "message", "No token provided"));
        }

        String token = authHeader.substring(7).trim();
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("authenticated", false, "message", "Invalid or expired token"));
        }

        String email = jwtUtil.extractEmail(token);
        String name = jwtUtil.extractName(token);

        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);
        response.put("email", email);
        response.put("name", name);
        response.put("token", token);

        return ResponseEntity.ok(response);
    }
}
