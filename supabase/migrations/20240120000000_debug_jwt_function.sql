-- Debug function to check JWT context in database
CREATE OR REPLACE FUNCTION debug_jwt_context()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'auth_uid', auth.uid(),
        'jwt_sub', current_setting('request.jwt.claim.sub', true),
        'jwt_tenant_id', current_setting('request.jwt.claim.tenant_id', true),
        'jwt_email', current_setting('request.jwt.claim.email', true),
        'current_user', current_user,
        'session_user', session_user
    );
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;