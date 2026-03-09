// ==========================================
// ESTADO GLOBAL
// ==========================================
let variables = [];

// ==========================================
// 1. GENERADOR ALEATORIO (Contexto Problema 2115)
// ==========================================
function generarEscenarioAleatorio() {
    const numVars = 3; // Fijamos en 3 hoteles iniciales exactos como en el problema
    let priorsRaw = [];
    let suma = 0;
    
    // Generar valores crudos de asignación de clientes
    for(let i = 0; i < numVars; i++) {
        let val = Math.floor(Math.random() * 40) + 10;
        priorsRaw.push(val);
        suma += val;
    }
    
    // Normalizar a 100% exacto para asegurar que es una partición válida
    let priors = priorsRaw.map(v => Math.round((v / suma) * 100));
    let sumaReal = priors.reduce((a, b) => a + b, 0);
    priors[priors.length - 1] += (100 - sumaReal); // Ajuste fino por redondeo

    // Únicamente los 3 hoteles del problema
    const nombresHoteles = ['Ramada Inn', 'Sheraton', 'Lakeview Motor Lodge'];
    variables = [];
    
    for(let i = 0; i < numVars; i++) {
        variables.push({
            id: Date.now() + i,
            name: nombresHoteles[i],
            prior: priors[i],
            conditional: Math.floor(Math.random() * 15) + 1 // Probabilidad de falla entre 1% y 15%
        });
    }
}

// ==========================================
// 2. MOTOR MATEMÁTICO (Probabilidad Total y Bayes)
// ==========================================
function validarParticion() {
    const suma = variables.reduce((acc, v) => acc + Number(v.prior), 0);
    const banner = document.getElementById('error-banner');
    
    if(suma !== 100) {
        banner.classList.remove('oculto');
        banner.innerText = `Error: El total de clientes asignados debe ser 100%. (Suma actual: ${suma}%)`;
        return false;
    }
    
    banner.classList.add('oculto');
    return true;
}

function calcularBayes() {
    if(!validarParticion()) return null;
    
    let probTotalFalla = 0; // Denominador: Probabilidad total de encontrar una falla
    
    // Calcular Probabilidad Total
    variables.forEach(v => {
        probTotalFalla += (v.prior / 100) * (v.conditional / 100);
    });
    
    // Calcular Probabilidad a Posteriori (Bayes) para cada hotel
    return variables.map(v => {
        const posteriori = probTotalFalla > 0 ? ((v.prior / 100) * (v.conditional / 100)) / probTotalFalla : 0;
        return { ...v, posteriori, probTotalFalla };
    });
}

// ==========================================
// 3. RENDERIZADO DEL DOM (Interfaz Izquierda)
// ==========================================
function renderInputs() {
    const container = document.getElementById('variables-container');
    container.innerHTML = '';
    
    variables.forEach((v) => {
        const div = document.createElement('div');
        div.style.marginBottom = "1.5rem";
        div.style.paddingBottom = "1rem";
        div.style.borderBottom = "1px solid var(--border-color)";
        div.innerHTML = `
            <div class="input-group">
                <input type="text" value="${v.name}" data-id="${v.id}" class="in-name" style="width: 85%;">
                <button data-id="${v.id}" class="btn-delete" style="background:none; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer;" title="Eliminar">&times;</button>
            </div>
            <div class="input-group">
                <label title="Porcentaje de clientes asignados">P(${v.name}) %:</label>
                <input type="number" value="${v.prior}" data-id="${v.id}" class="in-prior" min="0" max="100">
            </div>
            <div class="input-group">
                <label title="Probabilidad de falla en este hotel">P(Falla | ${v.name}) %:</label>
                <input type="number" value="${v.conditional}" data-id="${v.id}" class="in-cond" min="0" max="100">
            </div>
        `;
        container.appendChild(div);
    });
    
    // Asignar eventos a los nuevos inputs generados
    document.querySelectorAll('.in-name').forEach(i => i.addEventListener('input', e => actualizarValor(e, 'name', false)));
    document.querySelectorAll('.in-prior').forEach(i => i.addEventListener('input', e => actualizarValor(e, 'prior', true)));
    document.querySelectorAll('.in-cond').forEach(i => i.addEventListener('input', e => actualizarValor(e, 'conditional', true)));
    
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', e => {
        variables = variables.filter(v => v.id !== parseInt(e.target.dataset.id));
        renderInputs();
    }));
    
    actualizarSelector(); 
    actualizarVisualizacion();
}

function actualizarValor(e, campo, esNum) {
    const id = parseInt(e.target.dataset.id);
    const val = esNum ? (parseFloat(e.target.value) || 0) : e.target.value;
    const index = variables.findIndex(v => v.id === id);
    if(index !== -1) {
        variables[index][campo] = val;
        actualizarSelector(); // Actualiza los nombres en el menú si el usuario los edita
        actualizarVisualizacion();
    }
}

// Actualiza las opciones del menú desplegable (<select>)
function actualizarSelector() {
    const selector = document.getElementById('hotel-select');
    if(!selector) return; // Prevención si el HTML aún no carga

    const valorActual = selector.value;
    selector.innerHTML = ''; 
    
    variables.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = v.name;
        selector.appendChild(option);
    });

    // Mantener la selección actual si el hotel no fue eliminado
    if (valorActual && variables.find(v => v.id === parseInt(valorActual))) {
        selector.value = valorActual;
    } else if (variables.length > 0) {
        selector.value = variables[0].id;
    }
}

// ==========================================
// 4. RENDERIZADO VISUAL (Gráfica y Fórmulas)
// ==========================================
function actualizarVisualizacion() {
    const resultados = calcularBayes();
    if(!resultados) return; // Se detiene si la partición no suma 100%

    // A. Renderizar Gráfica en CSS Puro
    const chart = document.getElementById('css-chart-container');
    chart.innerHTML = '';
    resultados.forEach(v => {
        const pctPost = (v.posteriori * 100).toFixed(1);
        chart.innerHTML += `
            <div class="bar-group">
                <div class="bar-label">${v.name}</div>
                <div class="bar-track">
                    <div class="bar-fill fill-prior" style="width: ${v.prior}%">${v.prior}%</div>
                </div>
                <div class="bar-track">
                    <div class="bar-fill fill-post" style="width: ${pctPost}%">${pctPost}%</div>
                </div>
            </div>
        `;
    });

    // B. Renderizar Desglose Matemático
    const math = document.getElementById('math-container');
    
    // Obtener el hotel seleccionado del menú desplegable
    const selector = document.getElementById('hotel-select');
    const idSeleccionado = selector ? parseInt(selector.value) : resultados[0].id;
    const v1 = resultados.find(v => v.id === idSeleccionado) || resultados[0]; 
    
    // Formatear valores para la fórmula
    const pB1 = (v1.prior / 100).toFixed(2);
    const pCond = (v1.conditional / 100).toFixed(2);
    const numerador = (pB1 * pCond).toFixed(4);
    
    const desgloseDenom = resultados.map(v => `(${(v.conditional / 100).toFixed(2)} * ${(v.prior / 100).toFixed(2)})`).join(' + ');

    math.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 0.5rem;"><strong>Inciso A) Probabilidad Total</strong></p>
        <p style="margin-bottom: 1.5rem;">
            P(Falla general) = ${desgloseDenom} = <strong>${v1.probTotalFalla.toFixed(4)}</strong>
        </p>
        
        <p style="color: var(--text-muted); margin-bottom: 0.5rem;"><strong>Inciso B) Teorema de Bayes</strong></p>
        <p style="margin-bottom: 1rem;">¿Probabilidad de que el cliente se haya alojado en <strong>${v1.name}</strong> sabiendo que hubo una falla?</p>
        
        P(${v1.name} | Falla) = 
        <div class="fraccion">
            <span class="numerador">P(Falla | ${v1.name}) * P(${v1.name})</span>
            <span class="denominador">P(Falla general)</span>
        </div>
        
        <br><br>
        
        P(${v1.name} | Falla) = 
        <div class="fraccion">
            <span class="numerador">${pCond} * ${pB1}</span>
            <span class="denominador">${v1.probTotalFalla.toFixed(4)}</span>
        </div>
        
        <br><br>
        
        P(${v1.name} | Falla) = 
        <div class="fraccion">
            <span class="numerador">${numerador}</span>
            <span class="denominador">${v1.probTotalFalla.toFixed(4)}</span>
        </div>
        = <strong style="color: var(--accent-green); font-size: 1.2rem;">${v1.posteriori.toFixed(4)}</strong>
    `;
}

// ==========================================
// 5. INICIALIZACIÓN Y LISTENERS PRINCIPALES
// ==========================================
document.getElementById('btn-add-var').addEventListener('click', () => {
    variables.push({id: Date.now(), name: `Nuevo Hotel`, prior: 0, conditional: 0});
    renderInputs();
});

document.getElementById('btn-random').addEventListener('click', () => {
    generarEscenarioAleatorio();
    renderInputs();
});

// Listener para el menú desplegable del hotel evaluado
document.getElementById('hotel-select').addEventListener('change', () => {
    actualizarVisualizacion();
});

// Arrancar la aplicación al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    generarEscenarioAleatorio();
    renderInputs();
});