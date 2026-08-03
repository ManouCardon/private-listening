export async function onRequest(context) {
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

<form method="POST">

<input
type="password"
name="password"
required
>

<button>
Verder
</button>

</form>

</div>

</body>

</html>
`, {
    headers: {
        "Content-Type": "text/html;charset=UTF-8"
    }
});
}