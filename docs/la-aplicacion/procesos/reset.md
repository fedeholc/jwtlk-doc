# Reseteo de contraseña

El proceso de reseteo de contraseña se da del siguiente modo:

1. Desde la pantalla de login inicial, el usuario hace click en `reset password`. Se abrirá un dialog en el que deberá completar el campo `email` y hacer click en `Send me a code`.
2. El navegador hará una petición al endpoint `/reset-pass` del servidor con el email del usuario.
3. El servidor buscará el email en la base de datos y si existe, generará un código de reseteo y lo enviará al email del usuario. También enviará nua cookie segura y httpOnly con el código de reseteo para poder luego verificarlo.
4. El usuario recibirá un email con el código de reseteo y deberá ingresarlo en el campo `code` del dialog de reseteo, junto con un nuevo password y la confirmación del mismo. Luego hará click en `Change password`.
5. El navegador verificará los datos ingresados y hará una petición al endpoint `/change-pass` del servidor con el código de reseteo, el email del usuario, y el nuevo password.
6. El servidor verificará que el código de reseteo sea correcto y que no haya expirado. Si todo está bien, cambiará la contraseña del usuario, de lo contrario responderá con un error.

## Implementación del reseteo de contraseña

El proceso comienza cuando el usuario hace click en `reset password` en la pantalla de login. Se abre el modal `DE.reset.dialog` y se muestra el formulario de reseteo. El usuario completa el campo `email` y hace click en `Send me a code`.

La función que se va a encargar de manejar el evento es `handleSendCode`:

```js title="en frontend/src/script.js (fragmento)"
async function handleSendCode(e) {
  e.preventDefault();

  let inEmail = /** @type {HTMLInputElement} */ (
    document.querySelector("#reset-email")
  );

  if (!inEmail.validity.valid) {
    DE.reset.codeInfo.textContent = `Enter a valid email.`;
    vibrate(DE.reset.codeInfo);
    vibrate(DE.reset.sendButton);
    return;
  }
  try {
    let response = await fetch(apiURL.RESET_PASS, {
      method: "POST",
      credentials: "include", // to receive the reset code cookie
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: inEmail.value }),
    });

    if (!response.ok) {
      let data = await response.json();
      DE.reset.codeInfo.textContent = `Error sending code. ${data.error}`;
      vibrate(DE.reset.codeInfo);
      vibrate(DE.reset.sendButton);
      return;
    }

    DE.reset.codeInfo.textContent = `The security code was sent to your email. 
      Check your inbox.`;
    DE.reset.codeInfo.style.color = "green";
    DE.reset.codeInfo.style.fontWeight = "bold";
    vibrate(DE.reset.codeInfo);
    vibrate(DE.reset.sendButton);
    return;
  } catch (error) {
    console.error("Error sending code: ", error);
    DE.reset.codeInfo.textContent = `Error sending code. Try again later.`;
    vibrate(DE.reset.codeInfo);
    vibrate(DE.reset.sendButton);
  }
}
```

Vemos que allí primero se comprueba que el email sea válido, y luego se envía una petición `POST` al endpoint `/reset-pass` del servidor con el email del usuario. Si la respuesta es exitosa, se muestra un mensaje en pantalla indicando que el código de reseteo fue enviado al email del usuario.

En el servidor, la ruta `/reset-pass` es controlada por `handleResetPass`:

```js title="en backend/src/route-handlers/reset-pass.js"
export async function handleResetPass(req, res) {
  try {
    if (!req.body.email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await db.getUserByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    let resetCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const mailOptions = {
      from: config.GMAIL_USER,
      to: user.email,
      subject: "Reset your password",
      text: `Your reset code is: ${resetCode}`,
    };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_PASS,
      },
    });
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending email: ", error);
        return res.status(500).json({ error: "Failed to send email." });
      }
    });

    res.cookie("resetCookie", resetCode, resetCookieOptions);

    return res.status(200).json({ message: "Email sent." });
  } catch (error) {
    console.error("Error in handleResetPass", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

Primero se verifica que el email sea válido y que exista en la base de datos. Luego se genera un código de reseteo y se lo envía al usuario utilizando la librería `nodemailer`, y los datos de la cuenta de Gmail que configuramos en `.env` (este uso de Gmail es solo para pruebas, dadas sus limitaciones de envío de emails).

También se envía una cookie segura y httpOnly con el código de reseteo para poder luego recibirla cuando el usuario haga click en `Change password`, y verificar que el código sea correcto.

El usuario recibirá un email con el código de reseteo y deberá ingresarlo en el campo `code` del dialog de reseteo, junto con un nuevo password y la confirmación del mismo. Luego hará click en `Change password`.

La función que se encargará de manejar el evento es `handleChangePass`. Allí primero se verifica que todos los campos requeridos estén completos, y que las contraseñas coincidan. Luego se envía la siguiente petición:

```js title="en frontend/src/script.js (fragmento)"
let response = await fetch(apiURL.CHANGE_PASS, {
  method: "POST",
  credentials: "include", //send the cookie with the reset code
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: inputEmail.value,
    pass: inputPassword.value,
    code: inputCode.value,
  }),
});
```

En el servidor, la ruta `/change-pass` es controlada por `handleChangePass`:

```js title="en backend/src/route-handlers/change-pass.js"
export async function handleChangePass(req, res) {
  try {
    if (!req.body.code) {
      return res.status(400).json({ error: "Code is required" });
    }

    if (!req.cookies.resetCookie) {
      return res
        .status(400)
        .json({ error: "The code is ivalid or it has expired." });
    }

    if (req.body.code !== req.cookies.resetCookie) {
      return res.status(400).json({ error: "The entered code is incorrect" });
    }

    if (!req.body.pass) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (!req.body.email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await db.getUserByEmail(req.body.email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const response = await db.updateUser(
      req.body.email,
      hashPassword(req.body.pass)
    );

    if (!response) {
      return res.status(500).json({ error: "Error updating password" });
    }

    res.clearCookie("resetCookie");

    res.status(200).json({ message: "Password updated" });
  } catch (error) {
    console.error("Error in handleChangePass", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

Se verifica que el código de reseteo sea correcto y que no haya expirado. Luego se comprueba que el usuario exista en la base de datos, y se actualiza la contraseña.

Finalmente se borra la cookie con el código de reseteo y si no hubo errores, se responde con un mensaje de éxito. Del lado del cliente, se mostrará un mensaje indicando que la contraseña fue actualizada.
