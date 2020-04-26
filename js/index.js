let datosCoronavirus;


const peticionAPI = async function() {
    const response = await fetch('https://www.datos.gov.co/resource/gt2j-8ykr.json?$limit=5000');
    const json = await response.json();
    datosCoronavirus = json;
    mostrarDatos(json);
    dibujarGraficas(json)
}


const mostrarDatos = function(datosCoronavirus) {

    /* Mostrart datos de coronavirus en colombia */
    document.getElementById('total').append(datosCoronavirus.length)
    document.getElementById('hombres').append(datosCoronavirus.filter(item => item.sexo == 'M').length)
    document.getElementById('mujeres').append(datosCoronavirus.filter(item => item.sexo == 'F').length)
    document.getElementById('recuperados').append(datosCoronavirus.filter(({ atenci_n }) => atenci_n == 'Recuperado').length)
    document.getElementById('muertes').append(datosCoronavirus.filter(({ atenci_n }) => atenci_n == 'Fallecido').length)
    document.getElementById("muertes-menores-50").append(datosCoronavirus.filter((item) => item.atenci_n === "Fallecido" && item.edad <= 50).length);

    /*Lista de departamentos */
    let departamentos = datosCoronavirus.map(item => item.departamento);
    departamentos = departamentos.filter((item, indice) => departamentos.indexOf(item) === indice);
    crearDatalist(departamentos, 'datalist-departamentos')


}

const crearDatalist = (arreglo, ubicacion) => {

    let contenedorDatalist = document.getElementById(ubicacion)
    arreglo.sort().forEach((elm) => {
        opcion = document.createElement('option')
        opcion.value = elm
        contenedorDatalist.append(opcion)
    })

}


const calcularProbabilidad = function() {

    let persona = {}

    let inputs = document.querySelectorAll('#formularioProbabilidad input')
    Array.from(inputs).forEach((elm) => {
        if (elm.type == 'radio') {
            if (elm.checked) { persona[elm.name] = elm.value }
        } else {
            persona[elm.name] = elm.value
        }
    })

    let contagio;

    let casosDepartamento = datosCoronavirus.filter(({ departamento }) => persona.departamento == departamento)

    contagio = (casosDepartamento.length * 100 / datosCoronavirus.length)


    switch (persona.salidas) {
        case 'ninguna':
            break;
        case '1 a 3':
            contagio *= 4
            break;
        case '4 a 10':
            contagio *= 8
            break;
        case 'mas de 10':
            contagio *= 16
            break;
        default:
            break;
    }

    if (contagio < 0) contagio = 0
    if (contagio > 100) contagio = 100
    contagio = Math.floor(contagio)

    let mensaje = `Señor ${persona.nombre} siga teninedo en cuenta las medidas propuestas por las organizaciones de salud respecto a su aislamiento`
    let estadisticas = `<br><p>Casos en su departamento:<p> <span class="big-text-3">${casosDepartamento.length}</span>`

    document.getElementById('probabilidad').innerText = contagio + '%'
    document.getElementById('mensaje').innerText = mensaje
    document.getElementById('estadisticas-resultados').innerHTML = estadisticas

    document.getElementById('results').style.display = 'block'
    document.getElementById('estadisticas').style.opacity = 1
    document.getElementById('grafica').style.opacity = 1

}

const compararGraficas = function(country) {

    if (country !== '') {
        fetch("https://api.covid19api.com/total/country/" + country + "/status/confirmed?from=2020-03-01T00:00:00Z&to=2020-07-01T00:00:00Z", {
                method: "GET"
            })
            .then(respuesta => {
                return respuesta.json();
            })
            .then(myJson => {
                let datosOtroPais = myJson
                datosOtroPais = datosOtroPais.map(({ Cases }) => Cases).filter((Cases) => Cases > 0)
                dibujarGraficas(datosCoronavirus, datosOtroPais)
            })
            .catch(err => {
                console.log(err);
            });


    }

}


const cargarPaises = function() {
    fetch("https://api.covid19api.com/countries", {
            method: "GET"
        })
        .then(respuesta => {
            return respuesta.json();
        })
        .then(myJson => {
            let paises = myJson.map(({ Country }) => Country)
            crearDatalist(paises, 'datalist-paises')

        })
        .catch(err => {
            console.log(err);
        });

}

cargarPaises()


const dibujarGraficas = function(datosCoronavirus, datosOtroPais = []) {

    let fechasContagio = datosCoronavirus.map(({ fecha_diagnostico }) => fecha_diagnostico)

    let aumentoXdia = []
    let indice = 0,
        dia = 0,
        contagios = 0

    fechasContagio.forEach(fecha => {
        if (fechasContagio.indexOf(fecha) == indice) {
            contagios++
            aumentoXdia[dia] = contagios
            dia++;
        } else {
            contagios++
            aumentoXdia[dia] = contagios
        }
        indice++;
    })

    datosOtroPais = datosOtroPais.slice(0, aumentoXdia.length)

    dias = [...Array(aumentoXdia.length).keys()]



    /* Reducir resolucion de grafica */
    datosOtroPais = datosOtroPais.filter((elm, index) => index % 3 == 0)
    aumentoXdia = aumentoXdia.filter((elm, index) => index % 3 == 0)
    dias = dias.filter((elm, index) => index % 3 == 0)


    new Chartist.Line('.ct-chart', {
        labels: dias,
        series: [
            aumentoXdia,
            datosOtroPais
        ]
    }, {
        fullWidth: true,
        chartPadding: {
            right: 40
        }
    });


}


const agregarEventos = function(params) {

    let departamento = document.querySelector('[name = "departamento"]')
    departamento.addEventListener('click', () => departamento.value = '')


    let pais = document.querySelector('[name = "pais-comparacion"]')
    pais.addEventListener('click', () => pais.value = '')

    pais.addEventListener('change', () => compararGraficas(pais.value))

    let formulario = document.querySelector('#formularioProbabilidad')

    formulario.addEventListener('submit', (event) => {
        calcularProbabilidad()
        event.preventDefault()
    })
}

peticionAPI()
agregarEventos()

navigator.geolocation.getCurrentPosition((position) => console.log(position))