# Login con token (automático)

Cuando se inicia el frontend de la aplicación, éste comprueba si hay credenciales guardadas para autenticar automáticamente al usuario, lo cual puede ocurrir de dos maneras:

- Si hay un token de acceso válido en el local storage, se decodifica y se guarda en la información del usuario, dándolo por autenticado y mostrando la interfaz correspondiente.
- Si el token de acceso está vencido (o si no existe), pero hay un token de refresco válido, se utilizará este último para pedirle al servidor un nuevo token de acceso con el que se autenticará al usuario.

La necesidad de un nuevo login se da cuando:

- No hay credenciales guardadas.
- Tanto el token de acceso como el de refresco están vencidos.

Dado que los procesos de registro, login con usuario y contraseña, y login OAuth (Google/Github), terminan con el envío de los tokens al navegador, y con el usuario autenticado/logueado. Si éste cierra la pestaña y la vuelve a abrir, o si recarga la página, en tanto sus tokens no hayan expirado, se autenticará automáticamente.

¿Por cuanto tiempo ocurrirá el login automático? Eso dependerá de la duración del token de refresco, que a su vez depende de si el usuario marcó la opción "Remember me" al loguearse. Si marcó la opción, el token de refresco durará 30 días (y el de acceso una hora). Si no marcó la opción (o si se logueó con Google o Github), el token de refresco durará una hora (y el de acceso 10 minutos). Estas opciones pueden modificar en el `global-store.js` del backend.

## Implementación del login automático

En el frontend, una vez cargado el DOM, se ejecuta la función `main`:

```js title="en frontend/src/script.js (fragmento)"
async function main() {
  DE = getDomElementsRefs(document);
  setEventListeners();

  let accessToken = await auth.getAccessToken();

  if (accessToken) {
    userData = auth.decodeUserFromToken(accessToken);

    auth.addVisit(accessToken);
  }
  renderUI();
}
```

Allí `auth.getAccessToken` se encarga de obtener un token de acceso. Si lo logra, decodifica el token y guarda la información del usuario, quedando autenticado.
Si no lo logra, el usuario no estará autenticado y deberá loguearse manualmente.
`renderUI` se encarga de mostrar la interfaz correspondiente según si el usuario está autenticado o no.

Veamos entonces qué hace `auth.getAccessToken`:

```js title="en frontend/src/auth.js (fragmento)"
async function getAccessToken() {
  try {
    let accessToken = JSON.parse(localStorage.getItem("accessToken"));

    if (accessToken && !this.isTokenExpired(accessToken)) {
      return accessToken;
    }

    let newAccessToken = await this.getNewAccessToken();
    if (newAccessToken) {
      localStorage.setItem("accessToken", JSON.stringify(newAccessToken));
      return newAccessToken;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting access token: ${error}`);
    return null;
  }
}
```

Lo primero que hace es intentar obtener el token de acceso del local storage. Si lo logra y no expiró (lo cual comprueba mediante `isTokenExpired`), lo devuelve, y el usuario quedará autenticado.

Pero si no hay token de acceso o está vencido, intenta obtener uno nuevo llamando a `getNewAccessToken`. Si lo logra, lo guarda en el local storage, lo devuelve, y el usuario quedará autenticado. Si no, retorna `null` y el usuario tendrá que loguearse manualmente.

Veamos que hace `getNewAccessToken`:

```js title="en frontend/src/auth.js (fragmento)"
async function getNewAccessToken() {
  try {
    const response = await fetch(apiURL.REFRESH, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    if (data.accessToken) {
      return data.accessToken;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching new access token: ${error}`);
    return null;
  }
}
```

Envía una petición al endpoint `/refresh-token` del servidor. Si hay una cookie con un refresh token será enviada al servidor. Allí se encuentra la función `handleRefreshToken` es la que maneja esta petición:

```js title="en backend/src/route-handlers/refresh-token.js (fragmento)"
export async function handleRefreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token." });
  }

  let isDenied = await db.isDeniedToken(refreshToken);
  if (isDenied) {
    return res.status(401).json({ error: "Refresh token denied." });
  }

  try {
    let response = await jwtVerify(refreshToken, config.REFRESH_SECRET_KEY);
    if (!response) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = await genAccessToken(
      /**@type {types.TokenPayload} */ (response.payload),
      config.ACCESS_SECRET_KEY
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: `Invalid refresh token. ${error}` });
  }
}
```

Lo primero que hace es intentar obtener el token de refresco de la cookie. Si no lo logra, retorna un error. Luego verifica si el token de refresco fue denegado, o si ya expiró. En esos casos, también retorna un error y el usuario tendrá que loguearse manualmente.

Si el token de refresco resulta aún válido, generará un nuevo token de acceso y lo devolverá al frontend, para que lo guarde y autentique al usuario.

Dijimos al comienzo que el usuario podrá loguearse automáticamente mientras su token de refresco esté vigente y que eso dependerá de si marco la opción "Remember me" y de la configuración de los tokens y cookies en el backend.

En `global-store.js` encontraremos:

```js title="en backend/src/global-store.js (fragmento)"
export const accessJWTExpiration = {
  remember: "1h",
  noRemember: "10m",
};

export const refreshJWTExpiration = {
  remember: "30d",
  noRemember: "1h",
};
```

Allí se establece la duración de los tokens de acceso y de refresco según si el usuario marcó la opción "Remember me" o no. Y en `refreshCookieOptions` se definen las opciones de la cookie que se envía al navegador con el token de refresco:

```js title="en backend/src/global-store.js (fragmento)"
export const refreshCookieOptions = {
  remember: {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, //30d
  },
  noRemember: {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, //1h,
  },
};
```

La duración del token de refresco coincide con la duración de la cookie que lo contiene. Por lo tanto, si el usuario marcó la opción "Remember me", el token de refresco durará 30 días, y si no lo marcó, durará una hora.

:::note
En el anexo [**Herramientas del navegador**](/docs/anexos/herramientas.md) se explica que significan las distintas opciones de las cookies.
Vale aclarar que la opción `secure` se establece en `true` si el entorno de ejecución es producción, y en `false` si es desarrollo simplemente para poder trabajar localmente en http.
:::


