package Hackathon.Backened;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role = "USER";

    public User() {}

    public User(String name, String email, String password) {
        this.name     = name;
        this.email    = email;
        this.password = password;
        this.role     = "USER";
    }

    public Long getId()            { return id; }

    public String getName()        { return name; }
    public void setName(String n)  { this.name = n; }

    public String getEmail()       { return email; }
    public void setEmail(String e) { this.email = e; }

    public String getPassword()        { return password; }
    public void setPassword(String p)  { this.password = p; }

    public String getRole()        { return role; }
    public void setRole(String r)  { this.role = r; }
}
