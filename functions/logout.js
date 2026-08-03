export async function onRequest() {

    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
            "Set-Cookie": "lr_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
        }
    });

}