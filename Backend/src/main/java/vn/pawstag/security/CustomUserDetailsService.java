package vn.pawstag.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import vn.pawstag.entity.Owner;
import vn.pawstag.repository.OwnerRepository;

import java.util.List;

/**
 * Nạp UserDetails theo principal (= owner id từ JWT subject) cho Spring Security.
 * Không key theo email — email có thể null với tài khoản Facebook.
 * Mật khẩu rỗng nếu là tài khoản OAuth (không đăng nhập bằng password).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    public record AuthenticatedOwner(UserDetails userDetails, int authVersion) {}

    private final OwnerRepository ownerRepository;

    public CustomUserDetailsService(OwnerRepository ownerRepository) {
        this.ownerRepository = ownerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String principal) throws UsernameNotFoundException {
        return loadAuthenticatedOwner(principal).userDetails();
    }

    public AuthenticatedOwner loadAuthenticatedOwner(String principal) throws UsernameNotFoundException {
        Owner owner = ownerRepository.findByPrincipal(principal)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found: " + principal));

        UserDetails user = new User(
                String.valueOf(owner.getId()),
                owner.getPasswordHash() != null ? owner.getPasswordHash() : "",
                List.of(new SimpleGrantedAuthority("ROLE_" + owner.getRole()))
        );
        return new AuthenticatedOwner(user, owner.getAuthVersion());
    }
}
