-- V1: bảng owners (tài khoản chủ thú cưng)
CREATE TABLE owners (
    owner_id      BIGSERIAL PRIMARY KEY,
    email         VARCHAR(150) UNIQUE NOT NULL,    -- khóa đăng nhập
    phone         VARCHAR(20),                     -- nullable (register không thu)
    password_hash VARCHAR(255),                    -- nullable nếu login Google/Facebook
    full_name     VARCHAR(100),
    avatar_url    VARCHAR(500),                    -- dashboard avatar
    city          VARCHAR(100),                    -- profile sửa city
    auth_provider VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',   -- LOCAL / GOOGLE / FACEBOOK
    google_id     VARCHAR(100),
    facebook_id   VARCHAR(100),
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',    -- USER / ADMIN (gate /tags/batch)
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_owners_email ON owners(email);
