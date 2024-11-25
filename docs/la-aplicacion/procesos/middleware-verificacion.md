# Middleware de verificación

Si vemos el `app.js` en el backend, encontraremos que a diferencia de las rutas que hemos visto hasta ahora, las rutas `/add-visit` y `/get-visits` tienen un middleware de verificación:

```js title="en backend/src/app.js (fragmento)"
app.post(apiEP.RESET_PASS, handleResetPass);
app.post(apiEP.CHANGE_PASS, handleChangePass);

app.post(
  apiEP.ADD_VISIT,
  extractToken,
  verifyAccessToken(config.ACCESS_SECRET_KEY),
  handleAddVisit
);

app.get(
  apiEP.GET_VISITS,
  extractToken,
  verifyAccessToken(config.ACCESS_SECRET_KEY),
  handleGetVisits
);
```

Como vemos, las dos primeras rutas no tienen middleware, pero las dos últimas sí. El middleware de verificación se encarga de verificar que el token de acceso sea válido y esté firmado con la clave secreta correcta. Si no lo está, el middleware devuelve un error y la petición no llega al controlador de la ruta.

En las rutas vistas hasta ahora no era necesario ya que las mismas funciones de manejo de rutas se encargaban de verificar los tokens cuando era necesario, porque el usuario no accedía a las mismas ya autenticado. Pero en general en cualquier aplicación real, la mayoría de las rutas van a requerir comprobar la autenticación del usuario, y no tendría sentido repetir el código de verificación en cada controlador de ruta.

En nuestra aplicación `/add-visit` y `/get-visits` están precisamente para mostrar esto. La primera recibe una petición cada vez que un usuario visita la página (y guarda esa información en la base de datos), y la segunda devuelve todas las visitas registradas en la base de datos cuando el usuario lo solicita con el botón `View visits history`.

## Implementación del middleware

El middleware de verificación se compone de dos funciones: `extractToken` y `verifyAccessToken`. Es decir que cuando el backend recibe una petición a la ruta `/add-visit` o `/get-visits`, antes de llegar al controlador de la ruta, pasa primero `extractToken`, y luego por `verifyAccessToken`.

```js title="en backend/src/middleware.js"
function extractToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      req.token = authHeader.split(" ")[1].trim();
      if (!req.token || req.token.trim() === "") {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
}
```

Como se puede ver en el código, `extractToken` se encarga de extraer el token del header `Authorization` de la petición. Si no lo encuentra, o si no está en el formato correcto, devuelve un error 401. Si todo está bien, pasa el token a la siguiente función guardándolo en `req.token`, y llama a `next()` para que la petición siga su curso.

```js title="en backend/src/middleware.js"

unction verifyAccessToken(accessSecretKey) {
  async function verify(req, res, next) {
    const token = req.token;
    if (!token) {
      return res.status(401).json({ error: "Token not found." });
    }
    try {
      let response = await jwtVerify(token, accessSecretKey);
      req.body.payload = /** @type {types.TokenPayload} */ (response.payload);
      next();
    } catch (error) {
      return res.status(401).json({ error: `Invalid Token: ${error}` }); //
    }
  }
  return verify;
}
```

Como no es posible hacer que la función reciba `req`, `res`, `next` y `accessSecretKey` en una sola llamada, se utiliza una función que devuelve otra función. La función devuelta (`verify`) recibe `req`, `res` y `next`, pero también tiene acceso a `accessSecretKey` gracias al [closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures). Se encarga de verificar el token recibido con la clave secreta de acceso, y si todo está bien, guarda el payload del token en `req.body.payload` y llama a `next()`.

De esta forma, la función controladora de la ruta (`handleAddVisit` para `/add-visit` por ejemplo) recibe el payload del token en `req.body.payload` y puede utilizarlo para lo que necesite.

```js title="en backend/src/route-handlers/add-visit.js"
export default async function handleAddVisit(req, res) {
  try {
    let result = await db.addVisit(req.body.payload.user.id);
    if (result) {
      res.status(200).send({ success: true });
    } else {
      res.status(500).json("Error adding visit");
    }
  } catch (error) {
    console.error("Error adding visit", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

En este caso, `handleAddVisit` recibe el `id` del usuario que hizo la petición en `req.body.payload.user.id`, y lo utiliza para agregar una visita a la base de datos.

De esta forma, el middleware de verificación nos permite reutilizar el código de verificación de tokens en todas las rutas que lo necesiten, y mantenerlo separado de la lógica de las funciones controladoras.
