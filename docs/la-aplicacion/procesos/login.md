# Login con usuario y contraseña

El proceso de login con usuario y clave no difiere tanto del proceso de registro:

1. El usuario accede a la página y (suponemos que no está logueado) se le mostrará el formulario de login. Lo completa con su email y contraseña y hace click en `Log In`.
2. El navegador envía una petición al endpoint `/login` del servidor con los datos.
3. El servidor valida que email y contraseña sean son correctos, y de ser así, envía un token de acceso y un token de refresco.
4. En adelante sucede lo mismo que cuando el usuario se registra o ingresa mediante oauth:
   - El navegador recibe y guarda el token de acceso en el local storage
   - Decodifica el payload del token que con los datos del usuario, y los guarda en la variable global `userData`. El token de refresco se almacena automáticamente en una cookie.
   - El navegador redirige al usuario a la página de inicio (o a la que corresponda).

## Implementación del login con usuario y contraseña

En `script.js` de nuestro frontend, tenemos `DE.login.passButton.addEventListener("click", handleLogin);`, por lo que cuando el usuario hace click en el botón `Log In` se dispara la función `handleLogin`.

Lo primero que hace `handleLogin` es validar los campos email y password del formulario de login. Y en caso de que sean correctos, manda la siguiente petición al servidor:

```js title="en script.js (fragmento)"
let response = await fetch(apiURL.LOGIN, {
  method: "POST",
  credentials: "include", //to receive the cookie with the refresh token
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: inputEmail.value,
    pass: inputPassword.value,
    rememberMe: inputRememberMe.checked,
  }),
});
```

Como vemos, envía los datos del usuario y la preferencia de recordar la sesión al endpoint `/login` del servidor.

En el servidor, la ruta `/login` es controlada por `handleLogin` (ver [**'route-handlers/login.js'**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/route-handlers/login.js)), que al recibir la petición hace lo siguiente:

- Obtiene los datos a partir del body de la petición. Y busca al usuario en la base de datos mediante `db.getUserByEmail`.

- Si el usuario no existe o la contraseña es incorrecta, responde con un HTTP 401.
- Si los datos son correctos crea un token de acceso y uno de refresco, y los envían al navegador (del mismo modo que en el [proceso de registro](/docs/la-aplicacion/procesos/registro.md)).

En el navegador se recibe la respuesta y ocurre lo siguiente:

```js title="en script.js (fragmento)"
userData = auth.decodeUserFromToken(data.accessToken);
localStorage.setItem("accessToken", JSON.stringify(data.accessToken));
renderUI();
```

- Se decodifica el token y se guarda la información del usuario.
- Se guarda el token de acceso en el local storage.
- Se renderiza la interfaz con la información del usuario.

El usuario queda autenticado en la aplicación.