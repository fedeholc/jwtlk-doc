---
sidebar_position: 1
slug: /
---

# JWT Learning Kit

## Haz tu propia auth, al menos una vez en la vida

Está guía tiene como objetivo compartir lo que he aprendido implementando un **sistema de autenticación** desde cero usando **JSON Web Token (JWT)**. Espero que les resulte útil a quienes estén en el mismo camino, o al menos a mi yo del futuro que pronto comenzará a olvidar mucho de lo que aquí se presenta.

:::warning
La autenticación y la seguridad web en general es un campo crítico y de vital importancia para muchas aplicaciones. Esta guía no pretende ser una fuente de verdad ni dar consejos al respecto. Si lo necesitás, consultá bibliografía especializada y/o a personas expertas en el tema.
:::

Ya sea por motivos de seguridad o interés económico, se suele recomendar el uso de librerías y servicios de autenticación de terceros. Sin embargo, creo que en términos de aprendizaje es muy valioso intentar implementar un sistema de autenticación desde cero (al menos una vez en la vida). Es una experiencia que permite comprender cómo funciona de conjunto y cuál es la complejidad inherente al problema que se quiere resolver. Además, en el proceso se aprende sobre diversos temas vinculados al desarrollo web, tales como cookies, sesiones, tokens, cifrado, hashing, etc.

En esta guía encontraran entonces las explicaciones de los procesos y conceptos necesarios para comprender el funcionamiento y la puesta en práctica de un sistema de autenticación relativamente simple (pero funcional), basado en JSON Web Token (JWT). Se incluye también el [código fuente](https://www.github.com/fedeholc/jwtlk/) completo del módulo de autenticación de una aplicación que utilizaremos como ejemplo.

El frontend de la aplicación esta desarrollado en vanilla JavaScript. El backend en Node y Express. La base de datos es SQLite. El código está documentado con JSDoc.

Espero que les sirva tanto para el aprendizaje como para tener un punto de partida para implementar autenticación en sus proyectos. Toda devolución sobre la guía es apreciada y bienvenida. La mejor forma de contactarme es por mail a: [federicoholc@gmail.com](mailto:federicoholc@gmail.com).
