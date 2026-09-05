package Hackathon.Backened;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

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
        userRepository.save(new User(name, email, hashed));

        return ResponseEntity.ok(Map.of("message", "Account created successfully! Please log in."));
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

        // Wrong password
        if (!passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect password. Please try again."));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Login successful!",
                "email", email,
                "name", userOpt.get().getName()
        ));
    }
}
