package vn.pawstag.util;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Định dạng thời gian tương đối ("2 min ago") cho notifications + scan history.
 */
public final class TimeUtil {

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("MMM d, HH:mm").withZone(ZoneId.systemDefault());

    private TimeUtil() {}

    public static String relative(Instant when) {
        if (when == null) return null;
        Duration d = Duration.between(when, Instant.now());
        long mins = d.toMinutes();
        if (mins < 1) return "just now";
        if (mins < 60) return mins + (mins == 1 ? " min ago" : " min ago");
        long hours = d.toHours();
        if (hours < 24) return hours + (hours == 1 ? " hour ago" : " hours ago");
        long days = d.toDays();
        if (days == 1) return "Yesterday";
        if (days < 7) return days + " days ago";
        return DATE.format(when);
    }
}
