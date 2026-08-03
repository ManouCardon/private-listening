export async function onRequest(context) {

    const cookie = context.request.headers.get("Cookie") || "";
    let error = "";

    if (cookie.includes("lr_session=authenticated")) {
        return context.next();
    }

    if (context.request.method === "POST") {

        const form = await context.request.formData();
        const password = form.get("password");

        if (password === context.env.PASSWORD) {

    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
            "Set-Cookie": "lr_session=authenticated; HttpOnly; Secure; SameSite=Lax; Path=/;"
        }
    });

}

error = "❌ Het ingevoerde wachtwoord is niet juist.";
    }

    return new Response(`
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

${error ? `<p style="color:#ff6b6b;margin-top:16px;margin-bottom:0;font-size:14px;">${error}</p>` : ""}

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

<form method="POST" action="/">

</div>

</body>

</html>
`, {
    headers: {
        "Content-Type": "text/html;charset=UTF-8"
    }
});

}