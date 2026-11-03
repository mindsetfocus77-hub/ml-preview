# Miss Lith — sitio web

Landing de una sola página para **Miss Lith**, domina profesional en Valencia.
HTML, CSS y JS puros: sin build, sin npm, sin framework. Se sube tal cual.

```
miss-lith-web/
├── index.html
├── robots.txt          noindex mientras sea preview
├── assets/
│   ├── css/style.css
│   ├── js/main.js      interfaz: umbral 18+, filtros, lightbox, cursor…
│   ├── js/fx.js        WebGL: fondo de seda + carrusel 3D (módulo ES)
│   └── img/            lith-01…08.jpg + favicon.svg
└── README.md
```

## Probar en local

Hace falta servidor: `fx.js` es un módulo ES y por `file://` no carga.

```bash
python -m http.server 8080
```

## Dirección visual

**Borgoña y nácar.** Fondo vino casi negro, borgoña de base, nácar rosado en los
brillos y marfil cálido en el texto. Didone (Bodoni Moda) para los titulares y
DM Sans para el resto. La idea es terciopelo e intimidad, no el negro y oro
habitual del sector.

| | |
|---|---|
| `#1A0810` | fondo, vino casi negro |
| `#4A0E22` | borgoña |
| `#E8C8C0` | nácar rosado |
| `#F5E9E4` | marfil, texto |

## El 3D

Dos escenas WebGL con **Three.js 0.160.1**, cargado desde jsDelivr con un
`importmap` (hace falta conexión; en local sin internet el 3D no arranca).

**Fondo de seda.** Shader a pantalla completa con ruido fBm y deformación del
dominio: pliegues de tela que fluyen muy despacio, con un halo nácar siguiendo
al cursor. Se renderiza al 60% de resolución (45% en móvil) porque es una
imagen difusa y así cuesta la cuarta parte.

**Carrusel de la galería.** Un tambor de 16 planos (las 8 fotos, dos vueltas)
girando sobre su eje. Se arrastra con inercia, gira solo cuando lo sueltas, y
al pulsar una foto se abre en el lightbox. Las de atrás se tiñen de borgoña y
se apagan según su profundidad. Las texturas se reescalan a 620px al cargarlas
y el bucle se para cuando el carrusel sale de pantalla.

**Si WebGL falla**, `#drum` se queda oculto y la galería se ve como retícula
HTML normal. La web funciona entera sin 3D.

## De dónde sale el contenido

Todo el texto y las 8 fotos vienen de su ficha pública en
`dominasfemdom.com/valencia/miss-lith` (nombre, lema, bio, las 30 prácticas,
teléfono, email y X). La biografía se ha pasado a primera persona, que es como
funciona una web propia.

## Pendiente de que lo confirme ella

- [ ] **Tarifas** — la ficha no publica precios. Las cuatro tarjetas de `#tarifas`
      dicen «A consultar». Sustituir por los importes y duraciones reales.
- [ ] **Horarios** — tampoco estaban. Si quiere publicarlos, van en `#sesiones`.
- [ ] **Descripciones de las prácticas** — los 30 nombres son literales de su ficha;
      la frase que acompaña a cada uno está redactada por mí. Que las repase.
- [ ] **Protocolo y normas** — redactadas como texto profesional estándar del sector.
      Son las que más conviene que revise y ajuste a sus condiciones reales.
- [ ] **Bio en primera persona** — revisar tono.
- [ ] **Fotos** — las de la ficha están a 1333×2000 y bastante comprimidas.
      Lo ideal es que pase los originales: el carrusel 3D las luciría mucho más.

## Antes de publicar

1. **Quitar el noindex** — borrar `robots.txt` y cambiar el `<meta name="robots">`
   de `index.html` a `index, follow`.
2. **Dominio** — cambiar `https://misslith.com/` en el `<link rel="canonical">`,
   en `og:url` y en la firma del formulario (`main.js`).
3. **Formulario** — ahora abre el cliente de correo con `mailto:`. Si se prefiere
   envío real, conectar Formspree, Basin o similar cambiando el `submit` de `main.js`.
4. **Aviso legal, privacidad y cookies** — obligatorios en España (LSSI-CE y RGPD).
   No están. Hay que añadir las páginas y enlazarlas desde el pie.
5. **Three.js** — si no se quiere depender de un CDN, descargar `three.module.js`
   a `assets/js/` y apuntar ahí el `importmap`.
6. **Imágenes** — convertir a WebP y generar un `srcset` para móvil.

## Detalles técnicos

- Umbral 18+ con `sessionStorage` — vuelve a pedirse en cada visita nueva.
  Para que se recuerde entre sesiones, cambiar a `localStorage` en `main.js`.
- Cursor propio, barra de progreso de lectura y animaciones de entrada con
  `IntersectionObserver`.
- Buscador de prácticas insensible a tildes (`NFD` + quitar diacríticos).
- Datos estructurados `schema.org/Person` en el `<head>`.
- Respeta `prefers-reduced-motion`: sin animaciones y con la seda congelada.
- Responsive: 4 columnas → 3 → 2 → 1.
