# PawsTag Backend

Spring Boot 3.3, Java 17, PostgreSQL, Flyway, JWT, Swagger.

## Local Development

```bash
docker compose up -d
mvn spring-boot:run
```

- API base: `http://localhost:8082/api`
- Swagger UI: `http://localhost:8082/api/swagger-ui.html`
- Health: `GET http://localhost:8082/api/health`

Local database defaults are in `.env.example` and `docker-compose.yml`.

## Render Deployment

Create a Render Web Service from this repo with:

- Root Directory: `Backend`
- Runtime: `Java`
- Build Command: `mvn clean package -DskipTests`
- Start Command: `java -jar target/pawstag-backend-0.0.1-SNAPSHOT.jar`

Render provides `PORT`; `application.yml` reads it automatically.

Required environment variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://your-supabase-host:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres-or-the-user-shown-by-supabase
SPRING_DATASOURCE_PASSWORD=your-supabase-password
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-bytes
CORS_ORIGINS=https://your-vercel-app.vercel.app
UPLOAD_BASE_URL=https://your-render-service.onrender.com/api
GOONG_API_KEY=your-goong-rest-api-key
```

Optional environment variables:

```env
GOONG_API_URL=https://rsapi.goong.io
GEOCODING_ENABLED=true
RATE_LIMIT_PER_MINUTE=100
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=PawsTag <no-reply@pawstag.vn>
```

## Supabase Database

Use Supabase Postgres as the production database. Copy the Supabase connection
string and convert it to a JDBC URL:

```text
postgresql://postgres:password@host:5432/postgres
```

becomes:

```text
jdbc:postgresql://host:5432/postgres?sslmode=require
```

Set the username and password separately in Render. If Supabase gives you a
pooler connection string, keep the host, port, database, and username exactly as
shown by Supabase; only add the `jdbc:` prefix and `?sslmode=require`.
Flyway runs migrations from `src/main/resources/db/migration` on application
startup.

## Goong

Backend uses `GOONG_API_KEY` for REST APIs such as reverse geocoding scan
locations. Keep this key only in Render environment variables. Frontend map
tiles should use a separate Maptiles key.

If `GOONG_API_KEY` is empty, local development falls back to Nominatim.

## Notes

Render's local filesystem is ephemeral. Uploaded pet/avatar images stored in
`UPLOAD_DIR` can disappear after restarts or redeploys. For production, move
uploads to object storage later.

## Checks

```bash
mvn test
mvn clean package -DskipTests
```
