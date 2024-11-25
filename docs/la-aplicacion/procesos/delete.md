# Eliminación de usuario

La eliminación de un usuario también es bastante sencilla. Estando logueado el usuario hace click en el botón `Delete Account` en el que deberá ingresar su contraseña, y hacer click en el botón 'Delete Account' (del cuadro de diálogo).

La función `handleDeleteUser` será la encargada de responder al evento:

```js title="en script.js (fragmento)"
let email = userData.email;
  let inputPassword = /** @type {HTMLInputElement} */ (
    document.getElementById("delete-password")
  );

  try {
    let response = await fetch(apiURL.DELETE_USER, {
      method: "DELETE",
      credentials: "include", //send the refresh token to be invalidated
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, pass: inputPassword.value }),
    });

    if (!response.ok) {
      let data = await response.json();
      DE.delete.info.textContent = `Error deleting user: ${data.error}`;
      vibrate(DE.delete.info);
      vibrate(DE.delete.submitButton);
      return;
    }

    DE.delete.info.textContent = `User successfully deleted.`;
    DE.delete.info.style.color = "green";
    DE.delete.info.style.fontWeight = "bold";

    userData = null;
    localStorage.removeItem("accessToken");

    // show the error message for 2 seconds and then close the dialog
    setTimeout(() => {
      DE.delete.dialog.close();
      renderUI();
    }, 2000);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}
```

Como vemos, envía una petición `DELETE` al endpoint `/delete` del servidor, con el email y la contraseña del usuario. Si la respuesta es exitosa, elimina el token de acceso del local storage, borra la información del usuario en `userData` y renderiza la interfaz.

Del lado del servidor, la ruta `/delete` es controlada por `handleDeleteUser`:

```js title="en backend/src/route-handlers/delete.js"
export async function handleDeleteUser(req, res) {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "All fields are required." });
    }

    let userResponse = await db.getUserByEmail(email);
    if (!userResponse) {
      return res.status(404).json({ error: "User not found." });
    }

    if (hashPassword(pass) !== userResponse.pass) {
      return res.status(401).json({ error: "Invalid password." });
    }

    await db.deleteUser(email);

    // add refresh token to deny list
    const decoded = await jwtVerify(
      req.cookies.refreshToken,
      config.REFRESH_SECRET_KEY
    );

    db.addToDenyList(req.cookies.refreshToken, decoded.payload.exp * 1000);

    //logout user and clear cookies
    Object.keys(req.cookies).forEach((cookie) => {
      res.clearCookie(cookie);
    });

    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: `Error deleting user: ${error}` });
  }
}
```

Obtiene email y contraseña del body de la petición, busca al usuario en la base de datos, y si la contraseña es correcta lo elimina (de lo contrario devolverá un error). Luego invalida el token de refresco, agregándolo a la lista de denegación, y borra las cookies. Finalmente responde con un HTTP 204. Con esto, el usuario queda eliminado de la base de datos y deslogueado de la aplicación.
