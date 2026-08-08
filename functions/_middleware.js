const SESSION_COOKIE = "lr_session";
const SESSION_LIFETIME = 12 * 60 * 60 * 1000; // 12 uur

function base64urlEncode(bytes) {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64urlDecode(value) {
    const base64 = value
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded =
        base64 + "=".repeat((4 - base64.length % 4) % 4);

    const binary = atob(padded);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

async function getKey(secret) {
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        {
            name: "HMAC",
            hash: "SHA-256"
        },
        false,
        ["sign", "verify"]
    );
}

async function createSession(secret) {
    const timestamp = Date.now();
    const nonce = crypto.randomUUID();

    const payload = `${timestamp}.${nonce}`;

    const key = await getKey(secret);

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payload)
    );

    return `${base64urlEncode(
        new TextEncoder().encode(payload)
    )}.${base64urlEncode(
        new Uint8Array(signature)
    )}`;
}

async function verifySession(token, secret) {
    try {
        if (!token || !secret) {
            return false;
        }

        const parts = token.split(".");

        if (parts.length !== 2) {
            return false;
        }

        const payloadBytes = base64urlDecode(parts[0]);
        const signatureBytes = base64urlDecode(parts[1]);

        const payload =
            new TextDecoder().decode(payloadBytes);

        const [timestampString] = payload.split(".");

        const timestamp = Number(timestampString);

        if (!Number.isFinite(timestamp)) {
            return false;
        }

        // Sessie verlopen?
        if (Date.now() - timestamp > SESSION_LIFETIME) {
            return false;
        }

        // Geen timestamps uit de toekomst accepteren.
        if (timestamp > Date.now() + 60 * 1000) {
            return false;
        }

        const key = await getKey(secret);

        return await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes,
            payloadBytes
        );

    } catch {
        return false;
    }
}

function getCookie(request, name) {
    const cookieHeader =
        request.headers.get("Cookie") || "";

    const cookies =
        cookieHeader.split(";");

    for (const cookie of cookies) {

        const [key, ...valueParts] =
            cookie.trim().split("=");

        if (key === name) {
            return valueParts.join("=");
        }
    }

    return null;
}

function loginPage(error = "") {
    return new Response(`
<!DOCTYPE html>
<html lang="nl">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Luisterruimte</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: system-ui, sans-serif;
            background: #111827;
            color: white;

            display: flex;
            justify-content: center;
            align-items: center;

            height: 100vh;
        }

        .card {
            width: 360px;
            padding: 32px;
            border-radius: 16px;
            background: #1f2937;
        }

        h1 {
            margin-top: 0;
        }

        input {
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            border-radius: 8px;
            border: none;
        }

        button {
            width: 100%;
            margin-top: 16px;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        }

    </style>

</head>

<body>

<div class="card">

    <h1>Luisterruimte</h1>

    <p>Voer het wachtwoord in.</p>

    ${
        error
            ? `<p style="
                color:#ff6b6b;
                margin-top:16px;
                margin-bottom:0;
                font-size:14px;
            ">${error}</p>`
            : ""
    }

    <form method="POST">

        <input
            type="password"
            name="password"
            placeholder="Wachtwoord"
            autocomplete="current-password"
            autofocus
            spellcheck="false"
            required
        >

        <button type="submit">
            Login
        </button>

    </form>

</div>

</body>

</html>
`, {
        status: 200,
        headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "no-store"
        }
    });
}

export async function onRequest(context) {

    const { request, env } = context;

    const sessionSecret = env.SESSION_SECRET;

    if (!sessionSecret) {
        return new Response(
            "SESSION_SECRET is niet geconfigureerd.",
            {
                status: 500,
                headers: {
                    "Content-Type": "text/plain;charset=UTF-8"
                }
            }
        );
    }

    const sessionToken =
        getCookie(request, SESSION_COOKIE);

    const authenticated =
        await verifySession(
            sessionToken,
            sessionSecret
        );

    if (authenticated) {
        return context.next();
    }

    if (request.method === "POST") {

        const form =
            await request.formData();

        const password =
            form.get("password");

        if (
            typeof password === "string" &&
            password === env.PASSWORD
        ) {

            const token =
                await createSession(
                    sessionSecret
                );

            return new Response(null, {
                status: 302,

                headers: {
                    "Location": "/",

                    "Set-Cookie":
                        `${SESSION_COOKIE}=${token}; ` +
                        `HttpOnly; Secure; SameSite=Lax; Path=/`,

                    "Cache-Control": "no-store"
                }
            });
        }

        return loginPage(
            "❌ Het ingevoerde wachtwoord is niet juist."
        );
    }

    return loginPage();
}