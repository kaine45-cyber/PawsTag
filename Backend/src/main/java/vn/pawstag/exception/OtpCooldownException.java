package vn.pawstag.exception;

public class OtpCooldownException extends TooManyAttemptsException {
    private final int retryAfterSeconds;

    public OtpCooldownException(int retryAfterSeconds) {
        super("Please wait " + retryAfterSeconds + " seconds before requesting a new code.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
