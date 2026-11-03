# Miss Lith — sitio web

Landing de una sola página para **Miss Lith**, domina profesional en Valencia.
HTML, CSS y JS puros: sin build, sin dependencias, sin framework. Se sube tal cual.

```
miss-lith-web/
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/            lith-01…08.jpg + favicon.svg
└── README.md
```

## Probar en local

Abre `index.html` en el navegador, o levanta un servidor estático:

```bash
python -m http.server 8080
```

## Secciones

Verificación de edad · Hero · Marquesina · Sobre mí · Pegging · Prácticas (30, con
filtro y buscador) · Sesiones · Galería con lightbox · Protocolo y normas · Tarifas ·
Contacto con formulario · Pie.

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
- [ ] **Fotos** — las de la ficha están a 1333×2000 y algunas bastante comprimidas.
      Lo ideal es que pase los originales.

## Antes de publicar

1. **Dominio** — cambiar `https://misslith.com/` en el `<link rel="canonical">`,
   en `og:url` y en la firma del formulario (`main.js`, variable `body`).
2. **Formulario** — ahora abre el cliente de correo con `mailto:`. Si se prefiere
   envío real, conectar Formspree, Basin o similar cambiando el `submit` de `main.js`.
3. **Aviso legal, privacidad y cookies** — obligatorios en España (LSSI-CE y RGPD).
   No están. Hay que añadir las páginas y enlazarlas desde el pie.
4. **Imágenes** — convertir a WebP y generar un `srcset` para móvil.
5. **Analítica** — si se añade, que sea sin cookies (Plausible, Fathom) para no tener
   que montar banner de consentimiento.

## Detalles técnicos

- Tipografías: Cormorant Garamond + Jost (Google Fonts).
- Paleta tomada de la foto de portada: negro, esmeralda, rojo látex y latón.
- Verificación de edad con `sessionStorage` — vuelve a pedirse en cada visita nueva.
  Para que se recuerde entre sesiones, cambiar a `localStorage` en `main.js`.
- Datos estructurados `schema.org/Person` en el `<head>`.
- Respeta `prefers-reduced-motion`.
- Responsive: 4 columnas → 3 → 2 → 1.
