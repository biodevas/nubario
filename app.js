const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { ExifImage } = require('exif'); // Importar ExifImage
const gm = require('gm'); // Importar la biblioteca gm para compresión de imágenes

const db = new sqlite3.Database('nubario.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión a la base de datos establecida correctamente');
  }
});

const app = express();
const port = 3001;

// Configuración de Multer para la subida de imágenes
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.static('public'));
// Configurar el middleware para servir archivos estáticos desde la carpeta "uploads"
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  // Renderizar la página de subida de imágenes
  res.sendFile(__dirname + '/views/index.html');
});

// Ruta para obtener los detalles de las imágenes en formato JSON
app.get('/api/fotos', (req, res) => {
  const query = `
    SELECT
      f.nombre_archivo,
      f.ruta_archivo,
      f.fecha_creacion,
      f.ubicacion_latitud,
      f.ubicacion_longitud,
      f.resolucion,
      f.tipo_archivo,
      f.velocidad_obturador,
      f.tiempo_exposicion,
      f.iso,
      f.rotacion_imagen,
      f.fecha_hora,
      f.balance_blancos,
      f.distancia_focal,
      f.flash,
      f.objetivo,
      f.tipo_archivo_camara,
      f.tipo_camara,
      f.software_utilizado,
      f.etiquetado_gps,
      u.nombre AS autor
    FROM Fotografias AS f
    INNER JOIN Usuarios AS u ON f.autor_id = u.id
  `;

  db.all(query, (err, foto) => {
    if (err) {
      console.error('Error al obtener detalles de imágenes:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    res.json(foto);
  });
});

app.post('/subir', upload.single('foto'), async (req, res) => {
  const { nombre_autor, correo_autor } = req.body;
  const nombreArchivo = req.file.filename;
  const rutaArchivo = req.file.path;
  const rutaComprimida = rutaArchivo.replace(path.extname(rutaArchivo), '_compressed' + path.extname(rutaArchivo));

  // Obtener datos EXIF de la imagen
  try {
    new ExifImage({ image: rutaArchivo }, async (error, exifData) => {
      if (error) {
        // Manejar el caso de que no se encuentre el segmento Exif
        if (error.code === 'NO_EXIF_SEGMENT') {
          console.error('La imagen no contiene datos Exif.');
          // Puedes decidir cómo manejar este caso específico
          // Puedes establecer valores predeterminados o simplemente omitir los datos Exif
        } else {
          console.error('Error al leer datos EXIF:', error);
        }

        return res.redirect('/');
      }

      // Variables de datos EXIF
      const fechaCreacion = exifData.exif.CreateDate || new Date().toISOString();
      const fechaModificacion = exifData.exif.ModifyDate || new Date().toISOString();
      const resolucion = exifData.image.ImageWidth + 'x' + exifData.image.ImageHeight;
      const tipoArchivo = exifData.image.MIMEType;
      const velocidadObturador = exifData.exif.ExposureTime;
      const tiempoExposicion = exifData.exif.ExposureProgram;
      const iso = exifData.exif.ISO;
      const rotacionImagen = exifData.image.Orientation;
      const balanceBlancos = exifData.exif.WhiteBalance;
      const distanciaFocal = exifData.exif.FocalLength;
      const flash = exifData.exif.Flash;
      const objetivo = exifData.exif.LensModel;
      const tipoArchivoCamara = exifData.exif.FileSource;
      const tipoCamara = exifData.image.Make + ' ' + exifData.image.Model;
      const softwareUtilizado = exifData.image.Software;

      // Datos de GPS
      const gpsData = exifData.gps || {};
      const ubicacionLatitud = gpsData.GPSLatitude || '';
      const ubicacionLongitud = gpsData.GPSLongitude || '';
      const etiquetadoGps = gpsData.GPSLatitudeRef || gpsData.GPSLongitudeRef || '';
      const processingMethodBuffer = gpsData.GPSProcessingMethod || Buffer.alloc(0);

      // Convertir el buffer a una cadena de texto
      const processingMethodString = processingMethodBuffer.toString('utf-8');
      const latitud = gpsData.GPSLatitude || [];
      const latitudRef = gpsData.GPSLatitudeRef || '';
      const longitud = gpsData.GPSLongitude || [];
      const longitudRef = gpsData.GPSLongitudeRef || '';

      // Imprimir datos de GPS en la consola
      console.log('GPS Altitude:', gpsData.GPSAltitude, 'metros');
      console.log('GPS Altitude Ref:', gpsData.GPSAltitudeRef);
      console.log('GPS Date Stamp:', gpsData.GPSDateStamp);
      console.log('GPS Latitude:', gpsData.GPSLatitude);
      console.log('GPS Latitude Ref:', gpsData.GPSLatitudeRef);
      console.log('GPS Longitude:', gpsData.GPSLongitude);
      console.log('GPS Longitude Ref:', gpsData.GPSLongitudeRef);
      console.log('GPS Processing Method:', processingMethodString);
      console.log('GPS Time-Stamp:', gpsData.GPSTimeStamp);
      console.log('GPS Version ID:', gpsData.GPSVersionID);

      // Convertir a grados decimales
      const latitudDecimal = latitud[0] + latitud[1] / 60 + latitud[2] / 3600;
      const longitudDecimal = longitud[0] + longitud[1] / 60 + longitud[2] / 3600;

      // Ajustar según la referencia
      const latitudFinal = latitudRef === 'S' ? -latitudDecimal : latitudDecimal;
      const longitudFinal = longitudRef === 'W' ? -longitudDecimal : longitudDecimal;

      // Imprimir resultados
      console.log('Latitud:', latitudFinal);
      console.log('Longitud:', longitudFinal);


        // Obtener dirección postal a partir de latitud y longitud
        const direccionURL = `https://nominatim.openstreetmap.org/reverse?lat=${latitudFinal}&lon=${longitudFinal}&format=json`;

        try {
          const response = await fetch(direccionURL);
          const data = await response.json();

          // Verificar si se obtuvo una respuesta exitosa
          if (response.ok && data.display_name) {
            const direccionPostal = data.display_name;
            console.log('Dirección Postal:', direccionPostal);
            // Puedes almacenar la dirección en tu base de datos o usarla según tus necesidades
          } else {
            console.error('No se pudo obtener la dirección postal desde OpenStreetMap.');
          }
        } catch (error) {
          console.error('Error al obtener la dirección postal desde OpenStreetMap:', error);
        }

      // Redimensionar imagen
      gm(rutaArchivo)
        .resize(1280) // Redimensionar a un máximo de 1280px de ancho
        .write(rutaComprimida, async (err) => {
          if (err) {
            console.error('Error al redimensionar la imagen:', err);
            return res.redirect('/');
          }

          // Consulta para insertar en la base de datos
          const insertFotoQuery = `
            INSERT INTO Fotografias (
              autor_id, nombre_archivo, ruta_archivo, ruta_comprimida, 
              fecha_creacion, fecha_modificacion, ubicacion_latitud, ubicacion_longitud,
              resolucion, tipo_archivo, velocidad_obturador, tiempo_exposicion, iso,
              rotacion_imagen, balance_blancos, distancia_focal, flash, objetivo,
              tipo_archivo_camara, tipo_camara, software_utilizado, etiquetado_gps
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          // Consulta para buscar el usuario por correo
          const selectUsuarioQuery = `
            SELECT id FROM Usuarios WHERE correo = ?
          `;

          // Buscar usuario
          db.get(selectUsuarioQuery, [correo_autor], (err, usuario) => {
            if (err) {
              console.error('Error al buscar usuario:', err);
              return res.redirect('/');
            }

            // Si el usuario no se encuentra
            if (!usuario) {
              console.log('Usuario no encontrado');
              return res.redirect('/');
            }

            const autor_id = usuario.id;

            // Insertar datos en la base de datos
            db.run(
              insertFotoQuery,
              [
                autor_id, nombreArchivo, rutaArchivo, rutaComprimida, fechaCreacion, fechaModificacion,
                ubicacionLatitud, ubicacionLongitud, resolucion, tipoArchivo, velocidadObturador,
                tiempoExposicion, iso, rotacionImagen, balanceBlancos, distanciaFocal,
                flash, objetivo, tipoArchivoCamara, tipoCamara, softwareUtilizado, etiquetadoGps
              ],
              function (err) {
                if (err) {
                  console.error('Error al insertar foto:', err);
                  return res.redirect('/');
                }

                console.log('Foto insertada con ID:', this.lastID);
                // Redirigir a la página principal después de procesar todo
                return res.redirect('/');
              }
            );
          });
        });
    });
  } catch (error) {
    console.error('Error al leer datos EXIF:', error);
    return res.redirect('/');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});