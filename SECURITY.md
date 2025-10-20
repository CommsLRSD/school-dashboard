# Security Documentation

## Overview

This document outlines the security measures implemented in the School Dashboard application and provides guidance for maintaining security in production deployments.

## Security Features Implemented

### 1. Content Security Policy (CSP)

The application implements a strict Content Security Policy through meta tags in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="...">
```

**Policy Details:**
- `default-src 'self'`: Only load resources from the same origin by default
- `script-src`: Allow scripts from self, cdn.jsdelivr.net, and cdn.jigsawstack.com
- `style-src`: Allow styles from self, Google Fonts, and Font Awesome CDN
- `font-src`: Allow fonts from self, Google Fonts, Font Awesome, and data URIs
- `img-src`: Allow images from self, data URIs, and HTTPS sources
- `connect-src`: Allow connections to self and JigsawStack API
- `frame-src https://www.lrsd.net`: Allow iframes only from www.lrsd.net
- `object-src 'none'`: Block plugins like Flash
- `base-uri 'self'`: Prevent base tag injection
- `form-action 'self'`: Only allow form submissions to same origin
- `upgrade-insecure-requests`: Automatically upgrade HTTP to HTTPS

### 2. Security Headers

Multiple security headers are set via meta tags:

- **X-Frame-Options**: `SAMEORIGIN` - Prevents clickjacking by blocking the page from being framed by other sites
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filtering in older browsers
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Disables geolocation, microphone, and camera access

### 3. Subresource Integrity (SRI)

External resources use SRI to ensure they haven't been tampered with:

- Font Awesome CSS includes integrity hash
- Chart.js library includes integrity hash
- ChartJS Plugin includes integrity hash
- All external scripts use `crossorigin="anonymous"`

### 4. Input Sanitization

The application sanitizes all user inputs and data before rendering:

- `sanitizeHTML()` function escapes HTML entities
- Search inputs are validated and sanitized
- Filter values are validated before use
- Uses `textContent` instead of `innerHTML` where appropriate

### 5. XSS Prevention

Multiple layers of XSS prevention:

- Content Security Policy blocks inline scripts (with exceptions for necessary inline code)
- Input sanitization for all user-controlled data
- Proper output encoding when displaying data
- DOM manipulation uses safe methods

### 6. API Key Management

The JigsawStack Translation Widget API key is handled securely:

- Separated into `config.js` file for better management
- Documented as a public API key that is safe to expose
- Includes instructions for enhanced security in production
- Clear documentation about API key rotation

## Security Best Practices for Production

### 1. API Key Security

**Current Setup:**
The API key in `config.js` is a public client-side key that is safe to expose, but should be configured with:

1. **Domain Restrictions**: Configure in JigsawStack dashboard to only work on your domain
2. **Rate Limiting**: Set appropriate rate limits to prevent abuse
3. **Usage Monitoring**: Regularly monitor API usage for suspicious patterns

**Enhanced Production Setup:**

Create a backend proxy to completely hide the API key:

```javascript
// Backend endpoint (e.g., Node.js/Express)
app.post('/api/translate', async (req, res) => {
    const response = await fetch('https://api.jigsawstack.com/translate', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.JIGSAW_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
    });
    res.json(await response.json());
});
```

Then update `config.js` to use your backend:
```javascript
// Point to your backend instead
translationEndpoint: '/api/translate'
```

### 2. HTTPS Enforcement

**Critical**: Always serve the application over HTTPS in production.

- Obtain SSL/TLS certificate (Let's Encrypt is free)
- Configure web server to redirect HTTP to HTTPS
- The CSP includes `upgrade-insecure-requests` directive

### 3. Server-Side Security Headers

While we use meta tags, it's better to set security headers at the server level:

**nginx example:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'..." always;
```

**Apache example:**
```apache
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'..."
```

### 4. Regular Updates

Keep dependencies up to date:

- Monitor for security updates to Chart.js
- Monitor for security updates to Font Awesome
- Monitor for security updates to JigsawStack widget
- Regularly review and update SRI hashes when updating libraries

### 5. Data Validation

The `data/schools.json` file contains all school data:

- Validate JSON structure before deployment
- Ensure no sensitive information is included
- Regular audits of data content
- Consider adding JSON schema validation

### 6. Access Control

For GitHub Pages deployment:

- Repository should be public only if data is public
- Use branch protection for main/production branches
- Require pull request reviews
- Enable vulnerability alerts

### 7. Monitoring and Logging

Implement monitoring in production:

- Monitor for CSP violations (use report-uri directive)
- Track API usage and errors
- Set up alerts for unusual patterns
- Regular security audits

## Vulnerability Reporting

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Contact the repository maintainers privately
3. Provide detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Checklist for Deployment

- [ ] HTTPS is enforced on the web server
- [ ] Server-side security headers are configured
- [ ] API key is restricted by domain in JigsawStack dashboard
- [ ] Rate limiting is configured for API key
- [ ] API usage monitoring is set up
- [ ] CSP violations are being monitored
- [ ] Dependencies are up to date
- [ ] Regular security audits are scheduled
- [ ] Backup and recovery procedures are in place
- [ ] Access controls are properly configured

## Known Limitations

1. **CSP Inline Exceptions**: Some inline styles are necessary for dynamic functionality. These are marked with `'unsafe-inline'` but are kept to a minimum.

2. **Google Fonts**: Google Fonts CSS cannot use SRI as it serves different content based on user agent. This is acceptable as it's loaded over HTTPS from a trusted source.

3. **Client-Side API Key**: The translation widget requires a client-side API key. This is mitigated by domain restrictions and rate limiting in the JigsawStack dashboard.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SRI Documentation](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [Security Headers](https://securityheaders.com/)

## Last Updated

This security documentation was last updated on October 20, 2025.

## Contact

For security concerns, please contact the repository maintainers through GitHub.
