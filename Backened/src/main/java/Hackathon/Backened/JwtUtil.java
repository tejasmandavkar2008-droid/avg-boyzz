package Hackathon.Backened;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JwtUtil {

    private static final String SECRET = "AVG_BOYZZ_QUANT_RISK_ENGINE_SECURE_JWT_SECRET_KEY_2026";
    private static final long EXPIRATION_SECONDS = 7L * 24 * 60 * 60; // 7 Days in seconds

    private static final Pattern SUB_PATTERN = Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern NAME_PATTERN = Pattern.compile("\"name\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern EXP_PATTERN = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");

    /**
     * Generate standard RFC 7519 compliant HS256 JWT
     */
    public String generateToken(String email, String name) {
        try {
            long now = System.currentTimeMillis() / 1000;
            long exp = now + EXPIRATION_SECONDS;

            // 1. Header ({"alg":"HS256","typ":"JWT"})
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String encodedHeader = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));

            // 2. Payload Claims
            String safeName = (name != null) ? name.replace("\"", "\\\"") : email.replace("\"", "\\\"");
            String safeEmail = email.replace("\"", "\\\"");
            String payloadJson = "{\"sub\":\"" + safeEmail + "\",\"name\":\"" + safeName + "\",\"iat\":" + now + ",\"exp\":" + exp + "}";
            String encodedPayload = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));

            // 3. Signature
            String contentToSign = encodedHeader + "." + encodedPayload;
            String signature = sign(contentToSign, SECRET);

            return contentToSign + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Could not generate JWT token", e);
        }
    }

    /**
     * Validate JWT signature and expiration
     */
    public boolean validateToken(String token) {
        try {
            if (token == null || token.isBlank()) return false;
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;

            String contentToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(contentToSign, SECRET);

            // Constant-time comparison
            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            // Check expiration
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Matcher expMatcher = EXP_PATTERN.matcher(payloadJson);
            if (expMatcher.find()) {
                long exp = Long.parseLong(expMatcher.group(1));
                if (exp < (System.currentTimeMillis() / 1000)) {
                    return false; // Expired
                }
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extract user email from token
     */
    public String extractEmail(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Matcher subMatcher = SUB_PATTERN.matcher(payloadJson);
            if (subMatcher.find()) {
                return subMatcher.group(1).replace("\\\"", "\"");
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extract user name from token
     */
    public String extractName(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Matcher nameMatcher = NAME_PATTERN.matcher(payloadJson);
            if (nameMatcher.find()) {
                return nameMatcher.group(1).replace("\\\"", "\"");
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data, String secret) throws Exception {
        Mac hmacSha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        hmacSha256.init(secretKey);
        byte[] hash = hmacSha256.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(hash);
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
