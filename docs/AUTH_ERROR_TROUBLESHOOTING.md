# Authentication Error Troubleshooting Guide

## Understanding the Problem

The console message "Failed to load resource: the server responded with a status of 401 ()" indicates that your web browser attempted to retrieve a resource (like an image, script, stylesheet, or data from an API endpoint), but the server denied access because the request lacked valid authentication credentials. The HTTP status code 401 Unauthorized means that the request has not been applied because it lacks valid authentication credentials for the target resource.

## Common reasons for this error include:

- **Missing or invalid authentication token/header**: The request did not include the necessary Authorization header, or the token provided (e.g., JWT, API key) was expired, malformed, or rejected by the server.
- **Session expired**: The user's session has timed out, requiring re-authentication.
- **Incorrect credentials**: Even if credentials were sent, they might be incorrect or belong to an unauthorized user for that specific resource.

## How to verify

**Check the Network tab in DevTools:**
1. Open Chrome DevTools (F12 or Cmd+Option+I).
2. Go to the "Network" tab.
3. Reload the page.
4. Look for the failed request (it will likely be highlighted in red or show "401" in the Status column).
5. Click on the request and inspect the "Headers" tab.
6. Check the "Request Headers" section to see if an Authorization header was sent and what its value was.
7. Check the "Response Headers" for any WWW-Authenticate header, which might provide clues on the required authentication scheme.

**Examine the server logs:** If you have access, check your server-side logs for the corresponding request to see why it was rejected.

## Suggested fix

The fix depends on the authentication mechanism your application uses. Here are common approaches:

**Ensure authentication token is present and valid:**
If using token-based authentication (e.g., JWT), make sure the token is correctly retrieved (e.g., from localStorage, sessionStorage, or a cookie) and included in the Authorization header of your requests.

Verify the token's expiry date on the client-side before making the request, or handle token refresh if it's expired.

```javascript
// Example using fetch API with a bearer token
const accessToken = localStorage.getItem('accessToken'); // Or wherever you store it

if (accessToken) {
  fetch('/api/secure-resource', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`, // Include the token
      'Content-Type': 'application/json'
      // Note: In our Supabase setup, we use credentials: 'include' instead of manual Authorization header
    },
    credentials: 'include' // This is what we use for Supabase authentication
  })
  .then(response => {
    if (response.status === 401) {
      // Handle unauthorized, e.g., redirect to login
      window.location.href = '/login';
    }
    return response.json();
  })
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
} else {
  // No token found, redirect to login
  window.location.href = '/login';
}
```

**Re-authenticate user:** If the session has expired, prompt the user to log in again. This might involve redirecting them to a login page.

**Check API key configuration:** If you're using an API key, ensure it's correctly sent as required by the API (e.g., in a custom header, query parameter, or Authorization header).

**Verify server-side logic:** Confirm that the server's authentication middleware or logic is correctly validating the provided credentials and that the user associated with those credentials has permission to access the requested resource.

## Summary

A "401 Unauthorized" error means the server rejected a resource request due to missing or invalid authentication. To fix it, ensure valid authentication credentials (like an Authorization header with a correct token) are sent with the request, or handle expired sessions by re-authenticating the user. Inspecting the Network tab in DevTools is crucial for debugging.

## Our Specific Solution

In our Supabase + Next.js setup, we specifically addressed 401 errors by:

1. Setting `SUPABASE_JWT_COOKIE_SECURE=True` for production deployments
2. Using `createServerSupabaseClient({ cookies })` in API routes
3. Ensuring `credentials: 'include'` in frontend fetch requests
4. Properly configuring cookie handling between frontend and backend
5. Using `user.id` as tenant_id for RLS policies

These changes resolved the authentication session missing errors in our multi-tenant application.