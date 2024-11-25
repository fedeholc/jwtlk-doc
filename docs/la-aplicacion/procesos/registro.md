# Registro del usuario

En términos generales, el flujo de registro de un usuario es el siguiente:

1. Desde la página inicial el usuario hace click en el botón `Sign Up`. Ingresa su email, password y confirmación del password, y hace click en el botón `Sign Up` de la ventana de diálogo. El navegador hace la petición el endpoint `/register` con los datos del usuario.
2. El servidor recibe la petición, y comprueba si los datos son validos. Si no lo son devuelve un error. Si son correctos:
   - crea un nuevo usuario en la base de datos.
   - crea dos Tokens JWT, uno de acceso y otro de refresco, y los envía al navegador (el de acceso se envía en la respuesta, y el de refresco en una cookie).
3. El navegador recibe guarda el token de acceso en el local storage. También decodifica el payload del token, que los datos del usuario, y los guarda en la variable global `userData`. El token de refresco se almacena automáticamente en una cookie.
4. El navegador redirige al usuario a la página de inicio (o a la que corresponda).

Finalizado el proceso el usuario ya está registrado y autenticado. Veremos luego en detalle qué sucede cuando alguien registrado ingresa a la aplicación, pero completemos el esquema mental de como sigue el flujo para el usuario:

- cuando desde el navegador se realice otra petición lo hará enviando el token de acceso para que sea validado por el servidor.
- si el usuario vuelve a usar la aplicación luego de que haya pasado el tiempo de vida que tiene el token de acceso, no podrá utilizarlo, y en ese caso se enviará desde el navegador el token de refresco (que tiene una mayor duración), para obtener un nuevo token de acceso.
- en algún momento el token de refresco también expirará, cuando ello ocurra y el usuario intente autenticarse no podrá hacerlo y deberá volver a ingresar sus credenciales.

### Implementación del registro del usuario

El proceso comienza cuando el usuario hace click en el botón `Sign Up`. En [**`script.js`**](https://github.com/fedeholc/jwtlk/blob/main/frontend/src/script.js) tenemos registrado el siguiente evento:

```js title="en /frontend/script.js (fragmento)"
DE.login.signupButton.addEventListener("click", (e) => {
  e.preventDefault();
  DE.signup.dialog.showModal();
});
```

`DE.login.signupButton` es el botón `Sign Up` del formulario de login y `DE.signup.dialog` es el diálogo de registro. Dichas referencias están en [**`domElements.js`**](https://github.com/fedeholc/jwtlk/blob/main/frontend/src/domElements.js).

Es decir que cuando el usuario hace click en el botón `Sign Up` se muestra el diálogo de registro.

Cuando el usuario complete el formulario y haga click en el botón 'Sign Up' se disparará el siguiente evento:

```js title="en /frontend/script.js (fragmento)"
DE.signup.submitButton.addEventListener("click", handleSignUp);
```

`handleSignUp` es la función que se encarga de enviar los datos del usuario al servidor. Pero primero validará los datos ingresados por el usuario utilizando la función `auth.validateRegisterInputs`. Si los datos son incorrectos mostrará un error en pantalla.

Si los datos son válidos se intentará registrar al usuario en el servidor, utilizando `auth.registerNewUser` del siguiente modo:

```js title="en /frontend/script.js (fragmento)"
const { accessToken, error } = await auth.registerNewUser(
  inputEmail.value,
  inputPassword.value
);
```

Lo que hace `auth.registerNewUser` centralmente, es una petición `POST` al endpoint de registro (`apiURL.REGISTER`) con los datos del usuario:

```js title="en /frontend/script.js (fragmento)"
const response = await fetch(apiURL.REGISTER, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: email,
    pass: password,
  }),
});
```

Es importante que esté presente la opción `credentials: "include"`, para que el servidor pueda enviar la cookie con el token de refresco al navegador. Si no se incluye, el navegador no va a recibir la cookie. Cuando tengamos que enviar el token de refresco al servidor también vamos a tener que incluirlo. Por el contrario, cuando utilicemos el token de acceso no lo haremos, para evitar enviar innecesariamente la cookie con el token de refresco.

Veamos que sucede del lado del servidor cuando recibe la petición de registro. En [**`app.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/app.js) tenemos establecida la ruta `app.post(apiEP.REGISTER, handleRegister);`.
Por lo que será `handleRegister` la función que se encargará de registrar al usuario, del siguiente modo:

```js title="en /frontend/script.js"
export async function handleRegister(req, res) {
  try {
    const { pass, email } = req.body;

    if (!pass || !email) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!isValidUserEmail(email)) {
      return res.status(400).json({ error: "Invalid email." });
    }

    let userInDb = await db.getUserByEmail(email);
    if (userInDb) {
      return res.status(409).json({ error: "User or email already exist." });
    }

    const id = await db.insertUser(email, hashPassword(pass));

    /** @type {types.UserPayload} */
    const user = { id: id, email: email };

    /** @type {types.TokenPayload} */
    const payload = { user: user, rememberMe: false };

    const accessToken = await genAccessToken(payload, config.ACCESS_SECRET_KEY);
    const refreshToken = await genRefreshToken(
      payload,
      config.REFRESH_SECRET_KEY
    );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions.noRemember);

    return res.status(200).json({
      accessToken: accessToken,
    });
  } catch (error) {
    return res.status(500).json({ error: `Error registering user: ${error}` });
  }
}
```

Allí lo primero que se hace es obtener `email` y `pass` del cuerpo de la petición. Si falta alguno de los datos se devuelve un error 400. Lo mismo si el email no es válido.
Luego se verifica si el email ya está registrado en la base de datos mediante `db.getUserByEmail` (ver [**`db-sqlite.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/db/db-sqlite.js) o [**`db-turso.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/db/db-turso.js)) es la función que nos permite obtener el usuario de la base de datos a partir de consultar por el email. Si ya existe se devuelve un error.
Si el usuario no existe se lo inserta en la base de datos con `db.insertUser`, que nos devolverá el `id` del usuario en la tabla `user` de la base de datos.

Con el `id` y el `email` conformamos nuestro objeto `user`. Que será parte del objeto `payload` que se utilizará para generar los tokens de acceso y de refresco. Además del `user` el `payload` tiene un campo `rememberMe` que indica si el usuario quiere recordar la sesión o no. Inicialmente para el registro se establece en `false`.

En las siguientes lineas, con `genAccessToken` y `genRefreshToken` (ver [**`util-auth.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/util-auth.js) generamos los tokens de acceso y de refresco.

Luego, con `res.cookie` enviamos el token de refresco al navegador. El contenido de la cookie será `refreshToken` y las opciones de la cookie están definidas en `refreshCookieOptions.noRemember` (ver [**`global-store.js`**](https://github.com/fedeholc/jwtlk/blob/main/backend/src/global-store.js)).

Finalmente, si no hubo errores, se devuelve un status 200 con el token de acceso en la respuesta.

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
