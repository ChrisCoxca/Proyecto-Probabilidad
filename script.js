// ==========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
// Cada objeto representa un evento B_i
let variables = [];

// Referencias principales del DOM
const container = document.getElementById('dynamic-variables-container');
const btnAdd = document.getElementById('btn-add-var');
const btnRandom = document.getElementById('btn-generate');

// ==========================================
// 2. RENDERIZADO DE LA INTERFAZ
// ==========================================
function renderVariables() {
    // Limpiamos el contenedor antes de re-renderizar
    container.innerHTML = '';

    variables.forEach((v, index) => {
        // Creamos una tarjeta para cada variable
        const varDiv = document.createElement('div');
        varDiv.className = 'card';
        varDiv.style.marginBottom = '1rem';
        varDiv.style.padding = '1.25rem';
        varDiv.style.borderLeft = `4px solid var(--accent)`; // Detalle UI

        // Inyectamos el HTML de los inputs y sliders
        // Nota: Usamos delimitadores $...$ para que KaTeX los intercepte
        varDiv.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem; align-items: center;">
                <input type="text" value="${v.name}" data-id="${v.id}" class="input-name" 
                    style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 0.5rem; border-radius: 6px; font-family: inherit;">
                <button class="btn-delete" data-id="${v.id}" title="Eliminar variable"
                    style="background: transparent; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer;">
                    &times;
                </button>
            </div>
            
            <div class="range-group" style="margin-bottom: 1.25rem;">
                <div class="range-header">
                    <span>Probabilidad Previa $P(B_${index + 1})$</span>
                    <span class="badge" style="background: var(--bg-body); padding: 0.2rem 0.5rem; border-radius: 4px;">${v.prior}%</span>
                </div>
                <input type="range" class="prior-slider" data-id="${v.id}" min="0" max="100" step="1" value="${v.prior}">
            </div>
            
            <div class="range-group">
                <div class="range-header">
                    <span>Probabilidad Condicional $P(A|B_${index + 1})$</span>
                    <span class="badge" style="background: var(--bg-body); padding: 0.2rem 0.5rem; border-radius: 4px;">${v.conditional}%</span>
                </div>
                <input type="range" class="cond-slider" data-id="${v.id}" min="0" max="100" step="1" value="${v.conditional}">
            </div>
        `;

        container.appendChild(varDiv);
    });

    // Llamamos a KaTeX para renderizar la sintaxis matemática en los nuevos elementos inyectados
    if (window.renderMathInElement) {
        renderMathInElement(container, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    }

    // Aquí iría la llamada para enlazar eventos de los nuevos sliders y actualizar la gráfica
    // bindEvents(); 
    // updateChartAndMath();
}

// ==========================================
// 3. CONTROLADORES DE ESTADO
// ==========================================

// Función para añadir una nueva variable manualmente
function addVariable() {
    const newId = Date.now(); // ID único simple
    const newIndex = variables.length + 1;
    
    variables.push({
        id: newId,
        name: `Variable ${newIndex}`,
        prior: 0, // Inicia en 0 para no romper una suma previa del 100%
        conditional: 50
    });
    
    renderVariables();
}

// Función para generar un escenario completamente aleatorio
function generateRandomScenario() {
    // 1. Determinar número de variables (entre 2 y 4)
    const numVars = Math.floor(Math.random() * 3) + 2; 
    
    // 2. Generar probabilidades previas que sumen exactamente 100%
    let rawPriors = [];
    let sum = 0;
    for(let i = 0; i < numVars; i++) {
        let val = Math.random() + 0.1; // Evitamos valores en 0 absoluto para que sea más visual
        rawPriors.push(val);
        sum += val;
    }
    
    // Normalizamos a porcentajes enteros
    let priors = rawPriors.map(v => Math.round((v / sum) * 100));
    
    // Ajustamos el último valor para garantizar que la suma sea exactamente 100 por el redondeo
    let currentSum = priors.reduce((a, b) => a + b, 0);
    priors[priors.length - 1] += (100 - currentSum);

    // 3. Nombres genéricos para darle sabor al dashboard
    const prefixes = ['Máquina', 'Sensor', 'Ruta', 'Modelo', 'Inspector'];
    
    // 4. Construir el nuevo estado
    variables = [];
    for (let i = 0; i < numVars; i++) {
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const letter = String.fromCharCode(65 + i); // A, B, C, D...
        
        variables.push({
            id: Date.now() + i,
            name: `${randomPrefix} ${letter}`,
            prior: priors[i],
            conditional: Math.floor(Math.random() * 101) // De 0 a 100%
        });
    }
    
    renderVariables();
}

// ==========================================
// 4. INICIALIZACIÓN
// ==========================================
btnAdd.addEventListener('click', addVariable);
btnRandom.addEventListener('click', generateRandomScenario);

// Generar un escenario al cargar la página para que el dashboard no esté vacío
window.addEventListener('DOMContentLoaded', () => {
    generateRandomScenario();
});

// ==========================================
// 5. MOTOR MATEMÁTICO (Teorema de Bayes)
// ==========================================
function calcularBayes() {
    let probEvidencia = 0; // P(A), el denominador
    
    // 1. Calcular la probabilidad total de la evidencia P(A)
    // P(A) = Σ [ P(B_i) * P(A|B_i) ]
    variables.forEach(v => {
        const pBi = v.prior / 100;         // Convertimos de porcentaje a decimal
        const pAgivenBi = v.conditional / 100;
        probEvidencia += (pBi * pAgivenBi);
    });

    // 2. Calcular la probabilidad a posteriori para cada variable P(B_i|A)
    const resultados = variables.map(v => {
        const pBi = v.prior / 100;
        const pAgivenBi = v.conditional / 100;
        
        // Evitamos la división por cero si P(A) es 0
        const posteriori = probEvidencia > 0 ? (pAgivenBi * pBi) / probEvidencia : 0;
        
        return {
            ...v,
            posteriori: posteriori // Guardamos el resultado en formato decimal
        };
    });

    return { probEvidencia, resultados };
}

// ==========================================
// 6. RENDERIZADO DINÁMICO DE FÓRMULAS (KaTeX)
// ==========================================
function actualizarFormulaVisual() {
    const mathContainer = document.getElementById('math-container');
    
    if (variables.length === 0) {
        mathContainer.innerHTML = '<p style="color: var(--text-muted);">Añade variables para ver la fórmula.</p>';
        return;
    }

    const { probEvidencia, resultados } = calcularBayes();
    
    // Tomaremos la primera variable como ejemplo para el desglose paso a paso
    const v1 = resultados[0]; 
    
    // Formateamos los valores a decimales fijos para la presentación
    const pB1 = (v1.prior / 100).toFixed(2);
    const pAgivenB1 = (v1.conditional / 100).toFixed(2);
    const posteriorV1 = v1.posteriori.toFixed(4);
    const numerador = (pAgivenB1 * pB1).toFixed(4);
    
    // Construimos el denominador paso a paso concatenando todas las variables
    const denominadorDesglose = variables.map(v => {
        return `(${ (v.conditional/100).toFixed(2) } \\cdot ${ (v.prior/100).toFixed(2) })`;
    }).join(' + ');

    // Construimos el string de LaTeX puro (sin signos de dólar, ya que usaremos katex.render)
    const latexFinal = `
        \\begin{aligned}
        &\\text{1. Ecuación General:} \\\\
        &P(B_1|A) = \\frac{P(A|B_1) \\cdot P(B_1)}{P(A)} \\\\[1.5em]
        
        &\\text{2. Sustitución para } \\text{${v1.name}} \\text{ (Variable 1):} \\\\
        &P(B_1|A) = \\frac{${pAgivenB1} \\cdot ${pB1}}{${denominadorDesglose}} \\\\[1.5em]
        
        &\\text{3. Resultado Final:} \\\\
        &P(B_1|A) = \\frac{${numerador}}{${probEvidencia.toFixed(4)}} = \\mathbf{${posteriorV1}}
        \\end{aligned}
    `;

    // Renderizamos la ecuación directamente en el contenedor
    try {
        katex.render(latexFinal, mathContainer, {
            displayMode: true,     // Modo bloque (centrado)
            throwOnError: false,   // Evita que la app se rompa si hay un error de sintaxis
            strict: false
        });
    } catch (error) {
        console.error("Error al renderizar KaTeX:", error);
    }
}

// ==========================================
// 7. EVENT BINDING (Interactividad)
// ==========================================
// Esta función lee los cambios en la UI y actualiza el estado global
function bindEvents() {
    // Listeners para los sliders de Probabilidad Previa
    document.querySelectorAll('.prior-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id);
            const newValue = parseInt(e.target.value);
            
            const index = variables.findIndex(v => v.id === id);
            if(index !== -1) {
                variables[index].prior = newValue;
                // Actualizamos la etiqueta (badge) del número arriba del slider
                e.target.previousElementSibling.querySelector('.badge').innerText = newValue + '%';
                actualizarDashboard(); 
            }
        });
    });

    // Listeners para los sliders de Probabilidad Condicional
    document.querySelectorAll('.cond-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id);
            const newValue = parseInt(e.target.value);
            
            const index = variables.findIndex(v => v.id === id);
            if(index !== -1) {
                variables[index].conditional = newValue;
                e.target.previousElementSibling.querySelector('.badge').innerText = newValue + '%';
                actualizarDashboard();
            }
        });
    });

    // Listeners para cambiar el nombre de la variable y los botones de eliminar
    document.querySelectorAll('.input-name').forEach(input => {
        input.addEventListener('input', (e) => {
             const id = parseInt(e.target.dataset.id);
             const index = variables.findIndex(v => v.id === id);
             if(index !== -1) {
                 variables[index].name = e.target.value;
                 actualizarDashboard();
             }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            variables = variables.filter(v => v.id !== id);
            renderVariables(); // Re-renderizamos toda la lista si eliminamos una
        });
    });
}

// Función maestra para sincronizar todo
function actualizarDashboard() {
    actualizarFormulaVisual();
    // actualizarGrafico(); <-- Descomentaremos esto en el siguiente paso
}

// IMPORTANTE: Modificamos ligeramente la función renderVariables() de la Parte 1
// Al final de renderVariables(), debemos llamar a bindEvents() y actualizarDashboard()
// Reemplaza el final de tu función renderVariables() con esto:
const oldRender = renderVariables;
renderVariables = function() {
    oldRender(); // Llama a la inyección de HTML que escribimos antes
    bindEvents();
    actualizarDashboard();
}

// ==========================================
// 8. VISUALIZACIÓN DE DATOS (Chart.js)
// ==========================================
let bayesChart; // Variable global para almacenar la instancia de la gráfica

function inicializarGrafico() {
    const ctx = document.getElementById('bayesChart').getContext('2d');
    
    // Configuramos colores basados en nuestras variables CSS
    const colorPrior = 'rgba(148, 163, 184, 0.4)'; // Slate 400 tenue
    const borderPrior = 'rgba(148, 163, 184, 1)';
    
    const colorPosterior = '#3b82f6'; // Blue 500 vibrante (var(--accent))
    const borderPosterior = '#2563eb'; // Blue 600
    
    bayesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Se llenará dinámicamente
            datasets: [
                {
                    label: 'Previa P(Bi)',
                    data: [],
                    backgroundColor: colorPrior,
                    borderColor: borderPrior,
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.8,
                    categoryPercentage: 0.4
                },
                {
                    label: 'A Posteriori P(Bi|A)',
                    data: [],
                    backgroundColor: colorPosterior,
                    borderColor: borderPosterior,
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.8,
                    categoryPercentage: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Animaciones fluidas para cuando se mueven los sliders
            animation: {
                duration: 300, 
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100, // Fijamos el eje Y al 100%
                    grid: {
                        color: '#334155', // var(--border-color)
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#f8fafc',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 13
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f8fafc',
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b', // var(--bg-card)
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
}

function actualizarGrafico() {
    if (!bayesChart) return;

    // Obtenemos los cálculos más recientes de nuestro motor matemático
    const { resultados } = calcularBayes();

    // Mapeamos los datos para Chart.js
    const labels = resultados.map(v => v.name);
    const priorData = resultados.map(v => v.prior);
    
    // La fórmula nos devuelve la posteriori en decimales (ej. 0.85), 
    // lo multiplicamos por 100 para la gráfica
    const posteriorData = resultados.map(v => (v.posteriori * 100));

    // Inyectamos los nuevos arrays en la instancia
    bayesChart.data.labels = labels;
    bayesChart.data.datasets[0].data = priorData;
    bayesChart.data.datasets[1].data = posteriorData;

    // Ejecutamos la actualización
    bayesChart.update();
}

// ==========================================
// 9. CONEXIÓN FINAL
// ==========================================

// Sobrescribimos la función actualizarDashboard (de la Parte 2) para incluir la gráfica
function actualizarDashboard() {
    actualizarFormulaVisual();
    actualizarGrafico(); // Ahora la gráfica y la fórmula se actualizarán simultáneamente
}

// Actualizamos el listener de inicialización (de la Parte 1)
window.addEventListener('DOMContentLoaded', () => {
    inicializarGrafico(); // Instanciamos el canvas PRIMERO
    generateRandomScenario(); // Luego generamos las variables (esto llamará a actualizarDashboard)
});