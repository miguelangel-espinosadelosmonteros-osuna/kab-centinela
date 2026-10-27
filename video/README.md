# Video de Kaab (Remotion)

Video de 15 s para el pitch: la colmena que escucha, la fumigación en Nohalal, el aviso por SMS, el expediente sellado con KMS y el pasaporte con QR verificado. Usa los íconos, el logo y los datos de muestra de `../web`, así que siempre coincide con el tablero.

- `renders/kab-centinela.mp4`: el video final (1920×1080, 30 fps, 15 s, sin audio).
- `renders/kab-centinela-poster.jpg`: imagen fija del cierre.
- `../web/public/marca/fondo-panal.*`: el loop de 8 s que va detrás de la portada de "El problema".

## Comandos

```bash
npm install
npm run dev                      # Remotion Studio para ver y ajustar cada escena
npx remotion render KabCentinela renders/kab-centinela.mp4 --codec=h264 --crf=20
npx remotion still KabCentinela renders/kab-centinela-poster.jpg --frame=440 --image-format=jpeg
npx remotion render FondoPanal ../web/public/marca/fondo-panal.mp4 --codec=h264 --crf=30
npx remotion render FondoPanal ../web/public/marca/fondo-panal.webm --codec=vp9 --crf=48
npx remotion still FondoPanalPoster ../web/public/marca/fondo-panal.jpg --image-format=jpeg --jpeg-quality=70
```

Si el tablero está corriendo en el puerto 3000, agrega `--port=3123` para que no choquen.

## Escenas (`src/escenas/`)

| Escena | Duración | Qué pasa |
| --- | --- | --- |
| `Intro` | 0:00 a 0:03 | El panal del logo se arma, se llena de miel y aparece el nombre |
| `Fumigacion` | 0:03 a 0:06 | Pasa la avioneta; el zumbido de TEK-01 cae de 71 a 55 dB y las celdas pasan a urgente |
| `Alerta` | 0:06 a 0:09 | La onda sale de Nohalal A, alcanza a Nohalal B (1.4 km) y llegan los SMS |
| `Expediente` | 0:09 a 0:12 | Papel, sello de lacre KMS, "Inmutable: S3 Object Lock" y la huella SHA-256 |
| `Pasaporte` | 0:12 a 0:15 | El pasaporte se voltea al QR, la firma se verifica y cierra la marca |

Los números salen de `web/lib/demo-datos.json` (expediente de TEK-01). Si cambian los datos de muestra, vuelve a renderizar.
