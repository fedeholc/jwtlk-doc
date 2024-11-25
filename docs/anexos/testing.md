# Testing

Si accedes al repositorio de la aplicación vas encontrar que hay tests unitarios realizados con Vitest, para las rutas del backend y las funciones de autenticación (del backend y del frontend). Además hay tests end to end realizados con Playwright para los procesos principales.

Vale advertir que los tests no son exhaustivos y que así como hice está guía para aprender autenticación con JWT, al mismo tiempo tuve que aprender a hacer muchas cosas que no sabía en materia de testing, como cierto tipo de mocks, o usar supertest para las rutas, etc. Pero me han servido para poder refactorizar y cambiar cosas sin miedo a romper todo, y para poder seguir avanzando en el desarrollo de la aplicación. Por eso es que decidí igual compartirlos, creo que pueden ser útiles para alguien que esté en una situación similar a la mía.

Para correr los tests tenés que tener instaladas las dependencias tanto del backend como del frontend, es decir, hacer `npm install` en ambas carpetas. Es probable que también necesites hacer `npx playwright install` desde `frontend` para que se instalen los navegadores.

Luego podés correr los tests del siguiente modo:

- Tanto en la carpeta `backend` como en la carpeta `frontend` con `npx vitest` se ejecutan los tests unitarios.
- En la carpeta `frontend` con `npx playwright test` se ejecutan los tests end to end. Para que estos funcionen es necesario que el server esté corriendo, por lo que primero hay que hacer `npm start` en la carpeta `backend`.

Por otra parte, para los tests de Playwright si modificaste la URL del frontend para usar una distinta de `127.0.0.1:8080`, tenés que crear un archivo `.env` en la carpeta `frontend` con la variable `BASE_URL` con el valor que necesites.
