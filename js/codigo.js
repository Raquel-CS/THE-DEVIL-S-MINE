// ==========================================
// THE DEVIL'S MINE
// Videojuego de supervivencia - Canvas 2D
// ==========================================

// 1. CONECTAMOS HTML CON JAVASCRIPT

const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

const puntuacionHTML = document.getElementById("puntuacion");
const vidasHTML = document.getElementById("vidas");
const recordHTML = document.getElementById("record");
const mensaje = document.getElementById("mensaje");

const botonIniciar = document.getElementById("iniciar");
const botonPausar = document.getElementById("pausar");
const botonReiniciar = document.getElementById("reiniciar");

// ==========================================
// 2. CARGAMOS LAS IMÁGENES
// ==========================================
//FONDO DEL VIDEOJUEGO
const fondoMina = new Image();
fondoMina.src = "img/mina.jpeg";

// IMAGEN DEL MINERO: personaje del jugador.
const imagenMinero = new Image();
imagenMinero.src = "img/minero.png";

// IMAGEN DEL TÍO: personaje que lanza los objetos.
const imagenTio = new Image();
imagenTio.src = "img/tio.png";

// ==========================================
// 3. VARIABLES DEL JUEGO
// ==========================================

const ANCHO = canvas.width;
const ALTO = canvas.height;
const META = 1000;

let puntuacion = 0;
let vidas = 3;
let record = Number(localStorage.getItem("recordMina") || 0);

let estado = "inicio";
let objetos = [];
let teclas = {};

let tiempo = 0;
let ultimoTiempo = 0;
let intervaloLanzamiento = 1.2;
let dificultad = 1;

recordHTML.textContent = record;

// ==========================================
// 4. OBJETO JUGADOR: EL MINERO
// ==========================================

const minero = {

    x: 100,
    y: 320,

    ancho: 120,
    alto: 100,

    velocidad: 450,

    dibujar() {

        if (imagenMinero.complete && imagenMinero.naturalWidth > 0) {

            ctx.drawImage(
                imagenMinero,
                this.x,
                this.y,
                this.ancho,
                this.alto
            );

        } 
    },

    mover(delta) {

        // Movimiento horizontal.
        if (teclas.ArrowLeft || teclas.a || teclas.A) {
            this.x -= this.velocidad * delta;
        }

        if (teclas.ArrowRight || teclas.d || teclas.D) {
            this.x += this.velocidad * delta;
        }

        // Movimiento vertical.
        if (teclas.ArrowUp || teclas.w || teclas.W) {
            this.y -= this.velocidad * delta;
        }

        if (teclas.ArrowDown || teclas.s || teclas.S) {
            this.y += this.velocidad * delta;
        }

        // El minero permanece en el lado izquierdo.
        this.x = Math.max(40, Math.min(ANCHO * 0.52 - this.ancho, this.x));

        this.y = Math.max(150, Math.min(ALTO - this.alto - 40, this.y));
    },

    reiniciar() {
        this.x = 100;
        this.y = 190;
    }
};

// ==========================================
// 5. OBJETO TÍO DE LA MINA
// ==========================================

const tio = {

    x: 950,
    y: 160,

    ancho: 200,
    alto: 300,

    dibujar() {

        if (imagenTio.complete && imagenTio.naturalWidth > 0) {

            ctx.drawImage(
                imagenTio,
                this.x,
                this.y,
                this.ancho,
                this.alto
            );

        }
    },

    lanzar() {

        const tipos = ["moneda", "piedra", "humo", "fuego"];

        const tipo = tipos[Math.floor(Math.random() * tipos.length)];

        const posicionY = 130 + Math.random() * (ALTO - 220);

        objetos.push(new ObjetoLanzado(tipo, this.x, posicionY));
    }
};

// ==========================================
// 6. CLASE DE LOS OBJETOS LANZADOS
// ==========================================

class ObjetoLanzado {

    constructor(tipo, x, y) {

        this.tipo = tipo;

        this.x = x;
        this.y = y;

        this.tamano = tipo === "moneda" ? 18 : 30;

        this.velocidad = 220 + Math.random() * 90 + dificultad * 15;

        // Cada objeto tiene su propio movimiento vertical.
        this.movimientoY = (Math.random() - 0.5) * 100;

        this.ancho = this.tamano;
        this.alto = this.tamano;

        this.contado = false;
    }

    actualizar(delta) {

        // Los objetos vuelan desde el Tío hacia el minero.
        this.x -= this.velocidad * delta;

        // Movimiento ligeramente diagonal.
        this.y += this.movimientoY * delta;

    }

    dibujar() {

        if (this.tipo === "moneda") {

            // MONEDA DE ORO.
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(this.x, this.y, 19, 19);

            ctx.fillStyle = "#fff1a3";
            ctx.fillRect(this.x + 5, this.y + 4, 8, 11);

        }

        else if (this.tipo === "piedra") {

            // PIEDRA.
            ctx.fillStyle = "#777777";
            ctx.fillRect(this.x, this.y + 5, 30, 23);

            ctx.fillStyle = "#a8a8a8";
            ctx.fillRect(this.x + 5, this.y, 18, 10);

            ctx.fillStyle = "#454545";
            ctx.fillRect(this.x + 8, this.y + 20, 15, 8);

        }

        else if (this.tipo === "fuego") {

            // FUEGO.
            ctx.fillStyle = "#ed351e";
            ctx.fillRect(this.x + 5, this.y + 5, 22, 25);

            ctx.fillStyle = "#ff9d22";
            ctx.fillRect(this.x + 10, this.y, 14, 22);

            ctx.fillStyle = "#ffe75a";
            ctx.fillRect(this.x + 13, this.y + 12, 8, 13);

        }

        else if (this.tipo === "humo") {

            // HUMO.
            ctx.fillStyle = "#777777";

            ctx.fillRect(this.x + 5, this.y + 5, 20, 20);
            ctx.fillRect(this.x, this.y + 12, 15, 15);
            ctx.fillRect(this.x + 15, this.y, 17, 17);

        }
    }
}

// ==========================================
// 7. DETECCIÓN DE COLISIONES
// ==========================================

function colision(a, b) {

    return (
        a.x < b.x + b.ancho &&
        a.x + a.ancho > b.x &&
        a.y < b.y + b.alto &&
        a.y + a.alto > b.y
    );
}

// ==========================================
// 8. DIBUJAMOS EL ESCENARIO
// ==========================================

function dibujarEscenario() {

    // Si estamos jugando, mostramos el interior de la mina.
    // Si estamos en el inicio, mostramo

    if (fondoMina.complete && fondoMina.naturalWidth > 0) {

        ctx.drawImage(fondoMina, 0, 0, ANCHO, ALTO);

    } else {

        ctx.fillStyle = "#29231f";
        ctx.fillRect(0, 0, ANCHO, ALTO);
    }
}

// ==========================================
// 9. ACTUALIZAMOS LA PUNTUACIÓN
// ==========================================

function actualizarInterfaz() {

    puntuacionHTML.textContent = puntuacion;

    vidasHTML.textContent =
        "❤️".repeat(vidas) + "🖤".repeat(3 - vidas);

    recordHTML.textContent = record;
}

// ==========================================
// 10. MENSAJES DEL JUEGO
// ==========================================

function mostrarMensaje(titulo, texto, ayuda) {

    mensaje.innerHTML = `
        <h2>${titulo}</h2>
        <p>${texto}</p>
        <p class="tecla-ayuda">${ayuda}</p>
    `;

    mensaje.classList.remove("oculto");
}

function ocultarMensaje() {

    mensaje.classList.add("oculto");
}

// ==========================================
// 11. INICIAR PARTIDA
// ==========================================

function iniciarPartida() {

    if (estado === "jugando") return;

    if (estado === "victoria" || estado === "derrota") {
        reiniciarPartida();
    }

    estado = "jugando";

    ocultarMensaje();

    botonIniciar.textContent = "▶ En partida";
    botonPausar.disabled = false;

    ultimoTiempo = performance.now();
}

// ==========================================
// 12. PAUSAR Y CONTINUAR
// ==========================================

function alternarPausa() {

    if (estado === "jugando") {

        estado = "pausado";

        mostrarMensaje(
            "PARTIDA EN PAUSA",
            "El Tío está esperando...",
            "Pulsa continuar para regresar a la mina."
        );

        botonPausar.textContent = "▶ Continuar";

    }

    else if (estado === "pausado") {

        estado = "jugando";

        ocultarMensaje();

        botonPausar.textContent = "Ⅱ Pausar";

        ultimoTiempo = performance.now();
    }
}

// ==========================================
// 13. REINICIAR PARTIDA
// ==========================================

function reiniciarPartida() {

    puntuacion = 0;
    vidas = 3;

    dificultad = 1;
    tiempo = 0;

    objetos = [];

    minero.reiniciar();

    estado = "inicio";

    actualizarInterfaz();

    botonIniciar.textContent = "▶ Iniciar partida";
    botonPausar.textContent = "Ⅱ Pausar";
    botonPausar.disabled = true;

    mostrarMensaje(
        "¡BIENVENIDO A LA MINA!",
        "Esquiva los ataques del Tío y sobrevive hasta conseguir 1000 puntos.",
        "Usa W, A, S, D o las flechas."
    );

    dibujar();
}

// ==========================================
// 14. VICTORIA Y DERROTA
// ==========================================

function terminarPartida(resultado) {

    estado = resultado;

    botonPausar.disabled = true;
    botonIniciar.textContent = "▶ Jugar otra vez";

    if (puntuacion > record) {

        record = puntuacion;

        localStorage.setItem("recordMina", record);
    }

    actualizarInterfaz();

    if (resultado === "victoria") {

        mostrarMensaje(
            "¡LO LOGRASTE!",
            `¡Sobreviviste a la mina con ${puntuacion} puntos!`,
            "¡El Tío te ha permitido salir de la mina!"
        );

    } else {

        mostrarMensaje(
            "FIN DE LA PARTIDA",
            `El Tío te venció. Puntuación: ${puntuacion}.`,
            "Inténtalo otra vez, minero."
        );
    }
}

// ==========================================
// 15. ACTUALIZACIÓN DEL JUEGO
// ==========================================

function actualizar(delta) {

    minero.mover(delta);

    // El Tío lanza objetos cada cierto tiempo.
    tiempo += delta;

    intervaloLanzamiento = Math.max(
        0.50,
        1.2 - dificultad * 0.04
    );

    if (tiempo >= intervaloLanzamiento) {

        tiempo = 0;

        tio.lanzar();
    }

    // Actualizamos los objetos lanzados.
    for (let i = objetos.length - 1; i >= 0; i--) {

        const objeto = objetos[i];

        objeto.actualizar(delta);

        // COLISIÓN CON EL MINERO.
        if (colision(minero, objeto)) {

            objetos.splice(i, 1);

            if (objeto.tipo === "moneda") {

                // Recoger una moneda suma puntos.
                puntuacion += 10;

            } else {

                // Las piedras, el fuego y el humo quitan vidas.
                vidas--;
            }

            actualizarInterfaz();

            if (vidas <= 0) {

                terminarPartida("derrota");

                return;
            }

            if (puntuacion >= META) {

                puntuacion = META;

                actualizarInterfaz();

                terminarPartida("victoria");

                return;
            }

            continue;
        }

        // Si el objeto sale de la pantalla, desaparece.
        if (objeto.x + objeto.ancho < 0) {

            if (objeto.tipo !== "moneda") {

                puntuacion += 5;
                dificultad += 0.05;

                actualizarInterfaz();
            }

            objetos.splice(i, 1);
        }
    }
    // Comprobar si llegó a los 1000 puntos.
    if (puntuacion >= META) {
        puntuacion = META;
        actualizarInterfaz();
        terminarPartida("victoria");
        return;
    }

    // La dificultad aumenta progresivamente.
    dificultad = 1 + puntuacion / 50;
}

// ==========================================
// 16. DIBUJAR TODO EN CANVAS
// ==========================================

function dibujar() {

    ctx.clearRect(0, 0, ANCHO, ALTO);

    // Primero el fondo.
    dibujarEscenario();

    // Después el minero.
    minero.dibujar();

    // Después el Tío.
    tio.dibujar();

    // Finalmente los objetos lanzados.
    for (const objeto of objetos) {

        objeto.dibujar();
    }
}

// ==========================================
// 17. CICLO PRINCIPAL DEL VIDEOJUEGO
// ==========================================

function bucle(tiempoActual) {

    const delta = Math.min(
        (tiempoActual - ultimoTiempo) / 1000 || 0,
        0.04
    );

    ultimoTiempo = tiempoActual;

    if (estado === "jugando") {

        actualizar(delta);
    }

    dibujar();

    requestAnimationFrame(bucle);
}

// ==========================================
// 18. EVENTOS DEL TECLADO
// ==========================================

window.addEventListener("keydown", (evento) => {

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(evento.key)) {
        evento.preventDefault();
    }

    teclas[evento.key] = true;

    if (evento.key.toLowerCase() === "p") {
        alternarPausa();
    }

    if (evento.key === "Enter" && estado !== "jugando" && estado !== "pausado") {
        iniciarPartida();
    }
});

window.addEventListener("keyup", (evento) => {

    teclas[evento.key] = false;
});

// ==========================================
// 19. EVENTOS DE LOS BOTONES
// ==========================================

botonIniciar.addEventListener("click", iniciarPartida);

botonPausar.addEventListener("click", alternarPausa);

botonReiniciar.addEventListener("click", reiniciarPartida);

// ==========================================
// 20. CONTROLES PARA CELULARES
// ==========================================

function controlTactil(id, tecla) {

    const boton = document.getElementById(id);

    const presionar = (evento) => {
        evento.preventDefault();
        teclas[tecla] = true;
    };

    const soltar = (evento) => {
        evento.preventDefault();
        teclas[tecla] = false;
    };
        //los comandos para tactil arreglar 
    boton.addEventListener("pointerdown", presionar);
    boton.addEventListener("pointerup", soltar);
    boton.addEventListener("pointerleave", soltar);
    boton.addEventListener("pointercancel", soltar);
}

controlTactil("izquierda", "ArrowLeft");
controlTactil("derecha", "ArrowRight");
controlTactil("saltar", "ArrowUp");
controlTactil("abajo", "ArrowDown");

// ==========================================
// 21. INICIAMOS EL VIDEOJUEGO
// ==========================================

actualizarInterfaz();

dibujar();

requestAnimationFrame((tiempoInicial) => {

    ultimoTiempo = tiempoInicial;

    bucle(tiempoInicial);
});