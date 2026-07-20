package app.telos.user;

import app.telos.common.NotFoundException;
import app.telos.repo.UserRepository;
import app.telos.user.dto.PublicProfileDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public read of any resident's profile. */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository users;

    public UserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/{id}")
    public PublicProfileDto getUser(@PathVariable String id) {
        return users.findById(id)
                .map(PublicProfileDto::from)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
    }
}
