# Logout

El proceso de logout es tan sencillo que podemos ver directamente su implementación.

En el frontend, cuando el usuario hace click en el botón `Log Out`, se dispara la función `handleLogout`:

```js title="en script.js (fragmento)"
async function handleLogOut() {
  try {
    let response = await fetch(apiURL.LOGOUT, {
      method: "GET",
      credentials: "include", //to send the refresh token to be invalidated
    });
    if (!response.ok) {
      console.log(
        `Error logging out. ${response.status} ${response.statusText}`
      );
      return;
    }

    localStorage.removeItem("accessToken");
    userData = null;
    renderUI();
    return;
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
```

Como vemos, envía una petición `GET` al endpoint `/logout` del servidor, luego elimina el token de acceso del local storage, borra la información del usuario en `userData` y renderiza la interfaz.

Del lado del servidor, la ruta `/logout` es controlada por `handleLogOut`:

```js title="en backend/src/route-handlers/logout.js"
export async function handleLogOut(req, res) {
  try {
    const decoded = await jwtVerify(
      req.cookies.refreshToken,
      config.REFRESH_SECRET_KEY
    );

    // We add the expiration date to the denied list so that once the
    // expiration date has passed the token can be deleted from the list
    // (as it is no longer valid)
    // the expiration date is multiplied by 1000 to convert it to milliseconds
    db.addToDenyList(req.cookies.refreshToken, decoded.payload.exp * 1000);

    Object.keys(req.cookies).forEach((cookie) => {
      res.clearCookie(cookie);
    });

    res.status(200).send("ok");
  } catch (error) {
    console.error("Error during logout", error);
    res.status(500).send("Error during logout");
  }
}
```

Lo que hace `handleLogOut` es decodificar el token de refresco, y agregarlo a la lista de tokens denegados, junto con su fecha de expiración (convertida a milisegundos). La fecha de expiración es para que una vez pasada la misma el token pueda ser eliminado de la lista (ya que no sería válido y no podría ser reutilizado). Esto último aún tengo pendiente implementarlo.

Luego borra todas las cookies y responde con un `200 OK`.

Con esto, el usuario queda deslogueado de la aplicación, y el frontend mostrará la pantalla de login.
