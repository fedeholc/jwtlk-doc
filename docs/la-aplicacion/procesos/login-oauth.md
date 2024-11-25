# Login con Google / GitHub

El login con Google y GitHub se realiza mediante el protocolo OAuth 2.0. En ambos casos se sigue el mismo flujo de autenticación, que se puede resumir en los siguientes pasos:

1. El usuario hace click en `Login with Google`.
2. El navegador hace una petición al endpoint `/auth/google` de nuestro servidor.
3. El servidor devuelve una URL de autenticación de Google.
4. El navegador redirige al usuario a la URL de autenticación de Google.
5. El usuario se autentica en Google y autoriza a nuestra aplicación a acceder a su información.
6. Google redirige al usuario a nuestro endpoint `/auth/google/callback` con un código de autorización.
7. El servidor recibe el código y hace una petición a Google con el código y los datos del usuario (client_id, client_secret, redirect_uri, etc), para obtener un token de acceso a los recursos de éste.
8. Si los datos son correctos Google responde con el token de acceso.
9. El servidor recibe el token de acceso y hace una petición a Google para obtener los datos del usuario.
10. Google responde con los datos del usuario.
11. El servidor recibe el email del usuario y busca en la base de datos si ya hay alguien registrado con ese email. Si no existe, crea un nuevo usuario junto con un token de acceso y uno de refresco, que envía al navegador.
12. El servidor redirige al usuario a la página de la cual provino.

Como vemos, casi no hay diferencia entre el proceso de login y el de registro, solamente la creación del usuario en el punto 11. En ambos casos el usuario es autenticado y se le envían los tokens para que continúe utilizando la aplicación.

Tampoco hay diferencia entre el login con Google y el login con GitHub, salvo por los endpoints y las URLs de autenticación que se utilizan. En ambos casos el flujo de autenticación es el mismo ya que se basan en el protocolo OAuth 2.0 (en uno de sus posibles flujos). Para más información se pueden consultar los siguientes enlaces:

- https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow
- https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow

## Implementación del login con Google

Vayamos paso por paso en la implementación del login con Google.

1. El usuario hace click en `Login with Google`. La función que se va a encargar de manejar el evento es `handleLoginGG`.

2. `handleLoginGG` hace una petición al endpoint `/auth/google` de nuestro servidor:

```js title="en script.js (fragmento)"
let response = await fetch(apiURL.AUTH_GOOGLE, {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});
```

3. El servidor, mediante `handleAuthGoogle` devuelve la URL de autenticación de Google:

```js title="en route-handlers/auth-google.js (fragmento)"
const clientID = config.GOOGLE_CLIENT_ID;
const clientSecret = config.GOOGLE_CLIENT_SECRET;
const redirectURI = apiURL.AUTH_GOOGLE_CALLBACK;

/**
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export function handleAuthGoogle(req, res) {
  const googleAuthURL = `${googleEP.AUTHORIZE}?client_id=${clientID}&
  redirect_uri=${redirectURI}&response_type=code&scope=email profile`;
  res.status(200).json({ gauth: googleAuthURL });
}
```

La URL estará compuesta por el endpoint de oauth de Google (https://accounts.google.com/o/oauth2/auth), el `GOOGLE_CLIENT_ID` que definimos en `.env`, y el endpoint `/auth/google/callback` al que Google redirigirá al usuario luego de autenticarse. Además se le pide a Google que nos devuelva el email y el perfil del usuario, junto con el código de autorización.

4. El navegador redirige al usuario a la URL de autenticación de Google:

```js title="en script.js (fragmento)"
let returnTo = window.location.href;
document.cookie = `returnCookie=${returnTo}; path=/`;

let data = await response.json();
window.location.href = data.gauth;
```

`data.gauth` es la URL de autenticación de Google que recibimos del servidor.

Antes de redirigir al usuario, guardamos en una cookie la URL en la que se encuentra en ese momento, para recuperarla luego de la autenticación con Google y poder enviar al usuario a la página de la cual provino.

5. El usuario se autentica en Google y autoriza a nuestra aplicación a acceder a su información.

6. Google redirige al usuario a nuestro endpoint `/auth/google/callback` con un código de autorización.

7. El servidor, mediante `handleAuthGoogleCallback` recibe el código y hace una petición a Google con el código y los datos del usuario (client_id, client_secret, redirect_uri, etc), para obtener un token de acceso a los recursos de éste:

```js title="en route-handlers/auth-google.js (fragmento)"
const googleCode = req.query.code;

if (!googleCode) {
  return res.status(500).send("No authorization code received");
}

// Request access token from Google
const gResponse = await fetch(googleEP.ACCESS_TOKEN, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    client_id: clientID,
    client_secret: clientSecret,
    code: googleCode,
    redirect_uri: redirectURI,
    grant_type: "authorization_code",
  }),
});
```

8. Si los datos son correctos Google responde con el token de acceso.

9. El servidor recibe el token de acceso y hace una petición a Google para obtener los datos del usuario:

```js title="en route-handlers/auth-google.js (fragmento)"
const { access_token: gAccessToken } = await gResponse.json();
if (!gAccessToken) {
  return res.status(500).send("No access token received from Google");
}

// Request Google user data
const gUserResponse = await fetch(
  `${googleEP.USER}?access_token=${gAccessToken}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${gAccessToken}`,
    },
  }
);
```

Como vemos, en la petición a Google se envía el token de acceso en el header `Authorization`.

10. Google responde con los datos del usuario.

11. El servidor recibe el email del usuario y busca en la base de datos si ya hay alguien registrado con ese email. Si no existe, crea un nuevo usuario junto con un token de acceso y uno de refresco, que envía al navegador.

```js title="en route-handlers/auth-google.js (fragmento)"
const gUserData = await gUserResponse.json();
if (!gUserResponse.ok || !gUserData || !gUserData.email) {
  return res
    .status(500)
    .send(`Error obtaining user data from Google: ${gUserResponse.statusText}`);
}

/**@type {types.UserPayload & {pass: string}} */
let userInDB = await db.getUserByEmail(gUserData.email);

/**@type {types.UserPayload} */
let tokenUser;

if (!userInDB) {
  const id = await db.insertUser(
    gUserData.email,
    hashPassword(crypto.randomBytes(8).toString("hex"))
  );
  tokenUser = { id: id, email: gUserData.email };
} else {
  tokenUser = userInDB;
}

const refreshToken = await genRefreshToken(
  { user: tokenUser, rememberMe: true },
  config.REFRESH_SECRET_KEY
);

res.cookie("refreshToken", refreshToken, refreshCookieOptions.remember);
```

Si prestaste atención al código habrás visto que se genera una contraseña aleatoria para el usuario. Esto es porque ni Google ni Github proveen la contraseña del usuario, que por otra parte tampoco necesitamos, pero no queremos dejar el campo `pass` vacío.

Si el usuario que se registra mediante Google (o GitHub) quiere luego utilizar usuario y contraseña para autenticarse, podrá hacerlo mediante el proceso de reseteo de contraseña.

12. El servidor redirige al usuario a la página de la cual provino:

```js title="en route-handlers/auth-google.js (fragmento)"
let returnTo = req.cookies.returnCookie;
res.clearCookie("returnCookie");
res.redirect(returnTo);
```

Como vemos, obtiene la URL que guardamos en la cookie antes de redirigir al usuario a Google.

Con esto el usuario queda autenticado en la aplicación.
