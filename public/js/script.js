document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const imagenDetalle = document.getElementById('imagenDetalle');
    const detalleFoto = document.getElementById('detalleFoto');
    const detalleAutor = document.getElementById('detalleAutor');
    const detalleFecha = document.getElementById('detalleFecha');
    const detalleUbicacion = document.getElementById('detalleUbicacion');
    const detalleResolucion = document.getElementById('detalleResolucion');
    const detalleTipoArchivo = document.getElementById('detalleTipoArchivo');
    const detalleVelocidadObturador = document.getElementById('detalleVelocidadObturador');
    const detalleTiempoExposicion = document.getElementById('detalleTiempoExposicion');
    const detalleISO = document.getElementById('detalleISO');
    const detalleRotacionImagen = document.getElementById('detalleRotacionImagen');
    const detalleBalanceBlancos = document.getElementById('detalleBalanceBlancos');
    const detalleDistanciaFocal = document.getElementById('detalleDistanciaFocal');
    const detalleFlash = document.getElementById('detalleFlash');
    const detalleObjetivo = document.getElementById('detalleObjetivo');
    const detalleTipoArchivoCamara = document.getElementById('detalleTipoArchivoCamara');
    const detalleTipoCamara = document.getElementById('detalleTipoCamara');
    const detalleSoftwareUtilizado = document.getElementById('detalleSoftwareUtilizado');
    const detalleEtiquetadoGPS = document.getElementById('detalleEtiquetadoGPS');
    
    function cargarImagenes() {
        fetch('/api/fotos')
            .then(response => response.json())
            .then(data => {
                grid.innerHTML = ''; // Limpiar el grid antes de agregar las imágenes
                
                data.forEach(foto => {
                    const imageDiv = document.createElement('div');
                    imageDiv.className = 'image-container';
                    const image = document.createElement('img');
                    image.src = `/uploads/${foto.nombre_archivo}`; // Ruta correcta para la imagen
                    image.alt = foto.nombre_archivo;
                    const author = document.createElement('p');
                    author.textContent = `Autor ID: ${foto.autor_id}`;
                    
                    imageDiv.appendChild(image);
                    imageDiv.appendChild(author);
                    grid.appendChild(imageDiv);
                    
                    // Agregar evento de clic para mostrar detalles
                    imageDiv.addEventListener('click', () => mostrarDetalle(foto));
                });
            });
    }
    
	function mostrarDetalle(foto) {
		detalleFoto.src = foto.ruta_archivo;
		detalleAutor.textContent = 'Autor: ' + foto.autor;
		detalleFecha.textContent = 'Fecha Creación: ' + foto.fecha_creacion;
		detalleUbicacion.textContent = 'Ubicación: Latitud ' + foto.ubicacion_latitud + ', Longitud ' + foto.ubicacion_longitud;
		detalleResolucion.textContent = 'Resolución: ' + foto.resolucion;
		detalleTipoArchivo.textContent = 'Tipo de Archivo: ' + foto.tipo_archivo;
		detalleVelocidadObturador.textContent = 'Velocidad de Obturador: ' + foto.velocidad_obturador;
		detalleTiempoExposicion.textContent = 'Tiempo de Exposición: ' + foto.tiempo_exposicion;
		detalleISO.textContent = 'ISO: ' + foto.iso;
		detalleRotacionImagen.textContent = 'Rotación de la Imagen: ' + foto.rotacion_imagen;
		detalleBalanceBlancos.textContent = 'Balance de Blancos: ' + foto.balance_blancos;
		detalleDistanciaFocal.textContent = 'Distancia Focal: ' + foto.distancia_focal;
		detalleFlash.textContent = 'Flash: ' + foto.flash;
		detalleObjetivo.textContent = 'Objetivo: ' + foto.objetivo;
		detalleTipoArchivoCamara.textContent = 'Tipo de Archivo de la Cámara: ' + foto.tipo_archivo_camara;
		detalleTipoCamara.textContent = 'Tipo de Cámara: ' + foto.tipo_camara;
		detalleSoftwareUtilizado.textContent = 'Software Utilizado: ' + foto.software_utilizado;
		detalleEtiquetadoGPS.textContent = 'Etiquetado GPS: ' + foto.etiquetado_gps;

		// Mostrar el detalle
		imagenDetalle.classList.add('visible');
	}

	// Agregar evento de clic para cerrar los detalles al hacer clic fuera de la imagen
	imagenDetalle.addEventListener('click', (event) => {
		if (event.target === imagenDetalle) {
			imagenDetalle.classList.remove('visible');
		}
	});
    
    // Cargar las imágenes al cargar la página
    cargarImagenes();
});