# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Público general: entrenadores Pokémon que quieren llevar el registro de su colección a través de los juegos de la saga. Se usa sobre todo desde el móvil, mientras juegan. Cada persona entra con su cuenta (Google o email) y sus datos se sincronizan entre dispositivos.

## Product Purpose
PokéPlanner es una aplicación web progresiva en español para gestionar la colección Pokémon: qué se ha capturado en cada juego, cuáles son shiny, qué hay en caja, qué equipo se lleva en cada partida y cómo está construido cada Pokémon. El éxito es que un entrenador pueda anotar y consultar su progreso en segundos, sin perder datos al cambiar de dispositivo.

## Positioning
- **Seguimiento por juego:** capturas, shiny, Poké Ball, nivel y notas independientes en cada juego y en cada variante (por ejemplo, Zorua de Hisui y Zorua normal se rastrean por separado), en lugar de una lista global.
- **Equipos y fichas por juego:** equipo de 6 por juego, con naturaleza, habilidad, IVs y EVs de cada captura, recomendadores propios y análisis de debilidades de tipos.

## Operating Context
Se usa en el móvil como PWA, normalmente en paralelo a una partida. Los datos viven en la cuenta del usuario (Firebase) y en el navegador. Los datos de Pokémon, sprites y Pokédex regionales vienen de PokéAPI.

## Capabilities and Constraints
- **Plataforma confirmada:** debe funcionar como PWA en iPhone, desde la pantalla de inicio.
- Pokédex con los 1025 Pokémon hasta la 9ª generación, filtros y favoritos.
- Registro de capturas por juego y por variante; Trainer Card; comparador y wiki por Pokémon.
- Equipos por juego, fichas (naturaleza, habilidad, IVs, EVs) y recomendadores. En 1ª y 2ª generación no hay ficha.
- Sin confirmar con el usuario, pero observado en el código: interfaz en español, bloqueo del zoom con los dedos (decisión actual del usuario, «por ahora»), un único `index.html` estático publicado en GitHub Pages.
- El Safari (minijuego) existe en el código pero está oculto de la navegación.

## Brand Commitments
Nombre: PokéPlanner. Sin otros compromisos de marca confirmados.

## Evidence on Hand
README del proyecto con la lista de funciones. No hay testimonios, métricas de uso ni casos de estudio, y no deben inventarse.

## Product Principles
- Registrar un dato debe costar un toque o dos; la app se usa con una mano y a medio partido.
- Cada juego es su propio contexto: nada se mezcla entre juegos salvo que el usuario lo pida.
- Los datos del usuario son suyos y deben sincronizarse sin sorpresas ni pérdidas.
- Los recomendadores explican su motivo en lugar de dar respuestas opacas.

## Accessibility & Inclusion
Sin requisito de producto confirmado más allá de lo ya hecho (contraste, foco, nombres accesibles). El bloqueo del zoom es una decisión temporal del usuario.
