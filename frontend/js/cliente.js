document.addEventListener('DOMContentLoaded', () => {
    const clienteSlot = document.getElementById('clienteSlot');
    const clienteWrapper = document.querySelector('.cliente-wrapper');
    const tabsCliente = document.getElementById('tabsCliente');
    const tabBtns = tabsCliente ? Array.from(tabsCliente.querySelectorAll('.tab-btn')) : [];
    const clienteSlider = document.getElementById('clienteSlider');
    const clienteTrack = document.getElementById('clienteTrack');
    const secciones = clienteTrack ? Array.from(clienteTrack.querySelectorAll('.cliente-seccion')) : [];

    const formVehiculo = document.getElementById('formVehiculo');
    const formCita = document.getElementById('formCita');
    const btnCancelarVehiculo = document.getElementById('btnCancelarVehiculo');
    const btnLogout = document.getElementById('btnLogout');
    const userMenu = document.getElementById('userMenu');
    const btnUserMenu = document.getElementById('btnUserMenu');
    const btnAbrirConfigUsuario = document.getElementById('btnAbrirConfigUsuario');
    const modalConfigUsuario = document.getElementById('modalConfigUsuario');
    const btnCerrarModalConfig = document.getElementById('btnCerrarModalConfig');
    const btnCancelarModalConfig = document.getElementById('btnCancelarModalConfig');
    const formConfigUsuario = document.getElementById('formConfigUsuario');
    const nombreUsuarioActivo = document.getElementById('nombreUsuarioActivo');

    const inputKilometraje = document.getElementById('kilometraje');
    const btnKmBajar = document.getElementById('btnKmBajar');
    const btnKmSubir = document.getElementById('btnKmSubir');
    const yearControl = document.getElementById('yearControl');
    const inputAnio = document.getElementById('anio');
    const anioDatePicker = document.getElementById('anioDatePicker');
    const btnAbrirCalendarioAnio = document.getElementById('btnAbrirCalendarioAnio');
    const yearList = document.getElementById('yearList');

    const datetimeControl = document.getElementById('datetimeControl');
    const fechaCitaDisplay = document.getElementById('fechaCitaDisplay');
    const fechaCitaInput = document.getElementById('fechaCita');
    const btnAbrirCalendarioCita = document.getElementById('btnAbrirCalendarioCita');
    const calPrevMes = document.getElementById('calPrevMes');
    const calNextMes = document.getElementById('calNextMes');
    const calTituloMes = document.getElementById('calTituloMes');
    const calDiasGrid = document.getElementById('calDiasGrid');
    const calHorasList = document.getElementById('calHorasList');

    const ANIO_MINIMO = 1886;
    const ANIO_MAXIMO = 2026;

    let indiceActual = 0;
    let animando = false;

    let arrastrandoTab = false;
    let huboArrastreTab = false;
    let tabStartX = 0;
    let indiceInicialTab = 0;
    let progresoTabActual = 0;

    let arrastrandoAnios = false;
    let huboArrastreAnios = false;
    let anioStartY = 0;
    let anioScrollInicial = 0;
    let ultimoYAnio = 0;
    let ultimoTiempoAnio = 0;
    let velocidadAnio = 0;
    let inerciaFrameId = null;

    function detenerInerciaAnios() {
        if (inerciaFrameId !== null) {
            cancelAnimationFrame(inerciaFrameId);
            inerciaFrameId = null;
        }
        velocidadAnio = 0;
    }

    function iniciarInerciaAnios() {
        if (!yearList) return;
        function pasoInercia() {
            if (Math.abs(velocidadAnio) < 0.4) {
                detenerInerciaAnios();
                return;
            }
            const previo = yearList.scrollTop;
            yearList.scrollTop += velocidadAnio;
            velocidadAnio *= 0.94;
            if (Math.abs(yearList.scrollTop - previo) < 0.1 && Math.abs(velocidadAnio) > 1) {
                detenerInerciaAnios();
                return;
            }
            inerciaFrameId = requestAnimationFrame(pasoInercia);
        }
        inerciaFrameId = requestAnimationFrame(pasoInercia);
    }

    const ESPACIO_INFERIOR = 28;

    function calcularAlturaSeccion(seccion) {
        if (!clienteSlot || !clienteWrapper || !clienteSlider || !seccion) return 0;
        const alturaExtraWrapper = clienteWrapper.offsetHeight - clienteSlider.offsetHeight;
        const topSlot = clienteSlot.getBoundingClientRect().top;
        const alturaDisponibleSlider = window.innerHeight - topSlot - ESPACIO_INFERIOR - alturaExtraWrapper;
        return Math.max(seccion.offsetHeight, alturaDisponibleSlider);
    }

    function fijarAlturaSlot(seccion) {
        if (!clienteSlot || !clienteWrapper || !clienteSlider || !seccion) return;
        const alturaExtraWrapper = clienteWrapper.offsetHeight - clienteSlider.offsetHeight;
        const alturaSlider = calcularAlturaSeccion(seccion);
        clienteSlider.style.setProperty('--slider-min-height', alturaSlider + 'px');
        clienteSlot.style.height = (alturaSlider + alturaExtraWrapper) + 'px';
    }

    function cerrarSelectorAnio() {
        if (!yearControl || !clienteSlider) return;
        detenerInerciaAnios();
        yearControl.classList.remove('open');
        setTimeout(() => {
            if (!yearControl.classList.contains('open')) {
                clienteSlider.classList.remove('year-open');
            }
        }, 380);
    }

    function abrirSelectorAnio() {
        if (!yearControl || !clienteSlider) return;
        const abriendo = !yearControl.classList.contains('open');
        if (abriendo) {
            clienteSlider.classList.add('year-open');
            yearControl.classList.add('open');
            const seleccionado = yearList ? yearList.querySelector('.year-option.selected') : null;
            if (seleccionado) {
                seleccionado.scrollIntoView({ block: 'center' });
            }
        } else {
            cerrarSelectorAnio();
        }
    }

    if (yearList && inputAnio) {
        for (let y = ANIO_MAXIMO; y >= ANIO_MINIMO; y--) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'year-option';
            btn.textContent = String(y);
            btn.dataset.year = String(y);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (huboArrastreAnios) {
                    huboArrastreAnios = false;
                    return;
                }
                inputAnio.value = String(y);
                if (anioDatePicker) {
                    anioDatePicker.value = `${y}-01-01`;
                }
                Array.from(yearList.querySelectorAll('.year-option')).forEach((el) => {
                    el.classList.toggle('selected', el.dataset.year === String(y));
                });
                cerrarSelectorAnio();
            });
            yearList.appendChild(btn);
        }

        yearList.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            detenerInerciaAnios();
            arrastrandoAnios = true;
            huboArrastreAnios = false;
            anioStartY = e.clientY;
            ultimoYAnio = e.clientY;
            ultimoTiempoAnio = performance.now();
            anioScrollInicial = yearList.scrollTop;
            yearList.classList.add('dragging-years');
        });

        window.addEventListener('mousemove', (e) => {
            if (!arrastrandoAnios) return;
            const ahora = performance.now();
            const dt = Math.max(ahora - ultimoTiempoAnio, 8);
            const dy = e.clientY - ultimoYAnio;
            const velInstantanea = (-dy / dt) * 16;
            velocidadAnio = velocidadAnio * 0.35 + velInstantanea * 0.65;
            ultimoYAnio = e.clientY;
            ultimoTiempoAnio = ahora;

            const deltaY = e.clientY - anioStartY;
            if (Math.abs(deltaY) > 4) {
                huboArrastreAnios = true;
            }
            yearList.scrollTop = anioScrollInicial - deltaY;
        });

        window.addEventListener('mouseup', () => {
            if (!arrastrandoAnios) return;
            arrastrandoAnios = false;
            yearList.classList.remove('dragging-years');
            if (performance.now() - ultimoTiempoAnio > 80) {
                velocidadAnio = 0;
            }
            if (Math.abs(velocidadAnio) >= 0.8) {
                iniciarInerciaAnios();
            }
            setTimeout(() => {
                huboArrastreAnios = false;
            }, 0);
        });
    }

    function actualizarIndicadorTab(nuevoIndice) {
        tabsCliente.style.setProperty('--tab-index', nuevoIndice);
        tabBtns.forEach((btn, idx) => {
            btn.classList.toggle('active', idx === nuevoIndice);
        });
    }

    function aplicarIndice(nuevoIndice) {
        indiceActual = nuevoIndice;
        actualizarIndicadorTab(nuevoIndice);
        clienteTrack.style.transform = `translateX(-${nuevoIndice * 25}%)`;
    }

    if (clienteSlider && secciones.length > 0) {
        clienteSlider.style.height = calcularAlturaSeccion(secciones[0]) + 'px';
        fijarAlturaSlot(secciones[0]);
    }

    window.addEventListener('resize', () => {
        if (!animando && clienteSlider && secciones[indiceActual]) {
            clienteSlider.style.height = calcularAlturaSeccion(secciones[indiceActual]) + 'px';
            fijarAlturaSlot(secciones[indiceActual]);
        }
    });

    function cambiarSeccion(nuevoIndice, desdeArrastreTab = false) {
        if (nuevoIndice === indiceActual) {
            tabsCliente.style.setProperty('--tab-index', indiceActual);
            return;
        }
        cerrarSelectorAnio();
        cerrarSelectorCita();
        animando = true;
        ocultarAlerta();

        const seccionActual = secciones[indiceActual];
        const seccionNueva = secciones[nuevoIndice];

        if (desdeArrastreTab) {
            actualizarIndicadorTab(nuevoIndice);
        }

        fijarAlturaSlot(seccionActual);
        clienteSlider.style.height = calcularAlturaSeccion(seccionActual) + 'px';
        clienteSlider.offsetHeight;
        clienteSlider.style.height = '0px';

        setTimeout(() => {
            fijarAlturaSlot(seccionNueva);
            aplicarIndice(nuevoIndice);

            setTimeout(() => {
                clienteSlider.style.height = calcularAlturaSeccion(seccionNueva) + 'px';

                setTimeout(() => {
                    animando = false;
                }, 280);
            }, 300);
        }, 280);
    }

    function iniciarArrastreTab(clientX, targetBtn) {
        if (animando || !tabsCliente) return;
        const idxClicado = targetBtn ? parseInt(targetBtn.dataset.index, 10) : indiceActual;
        if (idxClicado !== indiceActual) return;
        arrastrandoTab = true;
        huboArrastreTab = false;
        tabStartX = clientX;
        indiceInicialTab = indiceActual;
        progresoTabActual = indiceActual;
        tabsCliente.classList.add('dragging-tab');
    }

    function moverArrastreTab(clientX) {
        if (!arrastrandoTab || !tabsCliente) return;
        const deltaX = clientX - tabStartX;
        if (Math.abs(deltaX) > 4) {
            huboArrastreTab = true;
        }
        const anchoTab = Math.max(1, (tabsCliente.clientWidth - 8) / 4);
        progresoTabActual = Math.max(0, Math.min(3, indiceInicialTab + (deltaX / anchoTab)));
        tabsCliente.style.setProperty('--tab-index', progresoTabActual);
    }

    function finalizarArrastreTab() {
        if (!arrastrandoTab || !tabsCliente) return;
        arrastrandoTab = false;
        tabsCliente.classList.remove('dragging-tab');

        if (!huboArrastreTab) {
            tabsCliente.style.setProperty('--tab-index', indiceActual);
            return;
        }

        const destino = Math.round(progresoTabActual);
        cambiarSeccion(destino, true);
        setTimeout(() => {
            huboArrastreTab = false;
        }, 0);
    }

    if (tabsCliente) {
        tabsCliente.addEventListener('mousedown', (e) => {
            const btn = e.target.closest('.tab-btn');
            iniciarArrastreTab(e.clientX, btn);
        });

        window.addEventListener('mousemove', (e) => {
            moverArrastreTab(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            finalizarArrastreTab();
        });

        tabsCliente.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const btn = e.target.closest('.tab-btn');
                iniciarArrastreTab(e.touches[0].clientX, btn);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (arrastrandoTab && e.touches.length > 0) {
                moverArrastreTab(e.touches[0].clientX);
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            finalizarArrastreTab();
        });
    }

    tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            if (huboArrastreTab) return;
            if (animando || idx === indiceActual) return;
            cambiarSeccion(idx, false);
        });
    });

    if (btnKmBajar && inputKilometraje) {
        btnKmBajar.addEventListener('click', () => {
            const actual = parseInt(inputKilometraje.value, 10) || 0;
            inputKilometraje.value = Math.max(0, actual - 1000);
        });
    }

    if (btnKmSubir && inputKilometraje) {
        btnKmSubir.addEventListener('click', () => {
            const actual = parseInt(inputKilometraje.value, 10) || 0;
            inputKilometraje.value = actual + 1000;
        });
    }

    if (btnAbrirCalendarioAnio) {
        btnAbrirCalendarioAnio.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirSelectorAnio();
        });
    }

    if (inputAnio) {
        inputAnio.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirSelectorAnio();
        });
    }

    function cerrarSelectorCita() {
        if (!datetimeControl || !clienteSlider) return;
        datetimeControl.classList.remove('open');
        setTimeout(() => {
            if (!datetimeControl.classList.contains('open') && (!yearControl || !yearControl.classList.contains('open'))) {
                clienteSlider.classList.remove('year-open');
            }
        }, 350);
    }

    function abrirSelectorCita() {
        if (!datetimeControl || !clienteSlider) return;
        const abriendo = !datetimeControl.classList.contains('open');
        if (abriendo) {
            cerrarSelectorAnio();
            clienteSlider.classList.add('year-open');
            datetimeControl.classList.add('open');
        } else {
            cerrarSelectorCita();
        }
    }

    const MESES_NOMBRES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const HORAS_DISPONIBLES = ['09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00'];

    const hoy = new Date();
    let calAnioActual = hoy.getFullYear();
    let calMesActual = hoy.getMonth();
    let fechaSeleccionada = null;
    let horaSeleccionada = '10:00';

    function actualizarValorCita() {
        if (!fechaSeleccionada || !fechaCitaInput || !fechaCitaDisplay) return;
        const yyyy = fechaSeleccionada.getFullYear();
        const mm = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaSeleccionada.getDate()).padStart(2, '0');
        fechaCitaInput.value = `${yyyy}-${mm}-${dd} ${horaSeleccionada}:00`;
        fechaCitaDisplay.value = `${dd}/${mm}/${yyyy} - ${horaSeleccionada}`;
    }

    function renderizarCalendarioCita() {
        if (!calTituloMes || !calDiasGrid) return;
        calTituloMes.textContent = `${MESES_NOMBRES[calMesActual]} ${calAnioActual}`;
        calDiasGrid.innerHTML = '';

        const primerDiaMes = new Date(calAnioActual, calMesActual, 1);
        const ultimoDiaMes = new Date(calAnioActual, calMesActual + 1, 0);
        const offsetLunes = (primerDiaMes.getDay() + 6) % 7;

        for (let i = 0; i < offsetLunes; i++) {
            const vacio = document.createElement('span');
            calDiasGrid.appendChild(vacio);
        }

        const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia++) {
            const btnDia = document.createElement('button');
            btnDia.type = 'button';
            btnDia.className = 'calendar-day';
            btnDia.textContent = String(dia);

            const fechaIter = new Date(calAnioActual, calMesActual, dia);
            if (fechaIter < hoySinHora) {
                btnDia.disabled = true;
            }

            if (
                fechaSeleccionada &&
                fechaSeleccionada.getFullYear() === calAnioActual &&
                fechaSeleccionada.getMonth() === calMesActual &&
                fechaSeleccionada.getDate() === dia
            ) {
                btnDia.classList.add('selected');
            }

            btnDia.addEventListener('click', (e) => {
                e.stopPropagation();
                fechaSeleccionada = new Date(calAnioActual, calMesActual, dia);
                actualizarValorCita();
                renderizarCalendarioCita();
            });

            calDiasGrid.appendChild(btnDia);
        }
    }

    if (calHorasList) {
        let arrastrandoHoras = false;
        let huboArrastreHoras = false;
        let horaStartX = 0;
        let horaScrollInicial = 0;
        let ultimoXHora = 0;
        let ultimoTiempoHora = 0;
        let velocidadHora = 0;
        let inerciaHoraFrameId = null;

        function detenerInerciaHoras() {
            if (inerciaHoraFrameId !== null) {
                cancelAnimationFrame(inerciaHoraFrameId);
                inerciaHoraFrameId = null;
            }
            velocidadHora = 0;
        }

        function iniciarInerciaHoras() {
            function pasoInerciaHora() {
                if (Math.abs(velocidadHora) < 0.4) {
                    detenerInerciaHoras();
                    return;
                }
                const previo = calHorasList.scrollLeft;
                calHorasList.scrollLeft += velocidadHora;
                velocidadHora *= 0.94;
                if (Math.abs(calHorasList.scrollLeft - previo) < 0.1 && Math.abs(velocidadHora) > 1) {
                    detenerInerciaHoras();
                    return;
                }
                inerciaHoraFrameId = requestAnimationFrame(pasoInerciaHora);
            }
            inerciaHoraFrameId = requestAnimationFrame(pasoInerciaHora);
        }

        HORAS_DISPONIBLES.forEach((hora) => {
            const btnHora = document.createElement('button');
            btnHora.type = 'button';
            btnHora.className = 'calendar-hour-btn' + (hora === horaSeleccionada ? ' selected' : '');
            btnHora.textContent = hora;
            btnHora.addEventListener('click', (e) => {
                e.stopPropagation();
                if (huboArrastreHoras) {
                    huboArrastreHoras = false;
                    return;
                }
                horaSeleccionada = hora;
                Array.from(calHorasList.querySelectorAll('.calendar-hour-btn')).forEach((el) => {
                    el.classList.toggle('selected', el.textContent === hora);
                });
                if (!fechaSeleccionada) {
                    fechaSeleccionada = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                    renderizarCalendarioCita();
                }
                actualizarValorCita();
                cerrarSelectorCita();
            });
            calHorasList.appendChild(btnHora);
        });

        calHorasList.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            detenerInerciaHoras();
            calHorasList.scrollLeft += (e.deltaY !== 0 ? e.deltaY : e.deltaX);
        }, { passive: false });

        calHorasList.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            detenerInerciaHoras();
            arrastrandoHoras = true;
            huboArrastreHoras = false;
            horaStartX = e.clientX;
            ultimoXHora = e.clientX;
            ultimoTiempoHora = performance.now();
            horaScrollInicial = calHorasList.scrollLeft;
            calHorasList.classList.add('dragging-hours');
        });

        window.addEventListener('mousemove', (e) => {
            if (!arrastrandoHoras) return;
            const ahora = performance.now();
            const dt = Math.max(ahora - ultimoTiempoHora, 8);
            const dx = e.clientX - ultimoXHora;
            const velInstantanea = (-dx / dt) * 16;
            velocidadHora = velocidadHora * 0.35 + velInstantanea * 0.65;
            ultimoXHora = e.clientX;
            ultimoTiempoHora = ahora;

            const deltaX = e.clientX - horaStartX;
            if (Math.abs(deltaX) > 4) {
                huboArrastreHoras = true;
            }
            calHorasList.scrollLeft = horaScrollInicial - deltaX;
        });

        window.addEventListener('mouseup', () => {
            if (!arrastrandoHoras) return;
            arrastrandoHoras = false;
            calHorasList.classList.remove('dragging-hours');
            if (performance.now() - ultimoTiempoHora > 80) {
                velocidadHora = 0;
            }
            if (Math.abs(velocidadHora) >= 0.8) {
                iniciarInerciaHoras();
            }
            setTimeout(() => {
                huboArrastreHoras = false;
            }, 0);
        });
    }

    if (calPrevMes && calNextMes) {
        calPrevMes.addEventListener('click', (e) => {
            e.stopPropagation();
            calMesActual--;
            if (calMesActual < 0) {
                calMesActual = 11;
                calAnioActual--;
            }
            renderizarCalendarioCita();
        });

        calNextMes.addEventListener('click', (e) => {
            e.stopPropagation();
            calMesActual++;
            if (calMesActual > 11) {
                calMesActual = 0;
                calAnioActual++;
            }
            renderizarCalendarioCita();
        });
    }

    renderizarCalendarioCita();

    if (btnAbrirCalendarioCita) {
        btnAbrirCalendarioCita.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirSelectorCita();
        });
    }

    if (fechaCitaDisplay) {
        fechaCitaDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirSelectorCita();
        });
    }

    function cerrarMenuUsuario() {
        if (!userMenu || !btnUserMenu) return;
        userMenu.classList.remove('open');
        btnUserMenu.setAttribute('aria-expanded', 'false');
    }

    function alternarMenuUsuario() {
        if (!userMenu || !btnUserMenu) return;
        const abriendo = !userMenu.classList.contains('open');
        userMenu.classList.toggle('open', abriendo);
        btnUserMenu.setAttribute('aria-expanded', abriendo ? 'true' : 'false');
    }

    function abrirModalConfig() {
        if (!modalConfigUsuario) return;
        cerrarMenuUsuario();
        modalConfigUsuario.classList.add('open');
        modalConfigUsuario.setAttribute('aria-hidden', 'false');
    }

    function cerrarModalConfig() {
        if (!modalConfigUsuario) return;
        modalConfigUsuario.classList.remove('open');
        modalConfigUsuario.setAttribute('aria-hidden', 'true');
    }

    if (btnUserMenu) {
        btnUserMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            alternarMenuUsuario();
        });
    }

    if (btnAbrirConfigUsuario) {
        btnAbrirConfigUsuario.addEventListener('click', () => {
            abrirModalConfig();
        });
    }

    if (btnCerrarModalConfig) {
        btnCerrarModalConfig.addEventListener('click', () => {
            cerrarModalConfig();
        });
    }

    if (btnCancelarModalConfig) {
        btnCancelarModalConfig.addEventListener('click', () => {
            cerrarModalConfig();
        });
    }

    if (modalConfigUsuario) {
        modalConfigUsuario.addEventListener('mousedown', (e) => {
            if (e.target === modalConfigUsuario) {
                cerrarModalConfig();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarMenuUsuario();
            cerrarModalConfig();
        }
    });

    const AUTH_ENDPOINT = '../backend/controller/auth_sw.php';
    const VEHICULO_ENDPOINT = '../backend/controller/vehiculo_sw.php';
    const CITA_ENDPOINT = '../backend/controller/cita_sw.php';

    const tablaVehiculos = document.getElementById('tablaVehiculos');
    const selectCitaVehiculo = document.getElementById('citaVehiculo');
    const tablaCitas = document.getElementById('tablaCitas');
    const tablaFacturas = document.getElementById('tablaFacturas');
    const btnGuardarVehiculo = document.getElementById('btnGuardarVehiculo');

    function recalcularAlturaActual() {
        if (!animando && clienteSlider && secciones[indiceActual]) {
            clienteSlider.style.height = calcularAlturaSeccion(secciones[indiceActual]) + 'px';
            fijarAlturaSlot(secciones[indiceActual]);
        }
    }

    function formatearFechaHora(fechaSql) {
        if (!fechaSql) return '-';
        const partes = String(fechaSql).split(' ');
        const fechaPartes = (partes[0] || '').split('-');
        if (fechaPartes.length !== 3) return fechaSql;
        const hora = partes[1] ? partes[1].slice(0, 5) : '';
        return `${fechaPartes[2]}/${fechaPartes[1]}/${fechaPartes[0]}${hora ? ' ' + hora : ''}`;
    }

    function formatearMoneda(valor) {
        const num = Number(valor) || 0;
        return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    }

    function prepararEdicionVehiculo(vehiculo) {
        document.getElementById('idVehiculo').value = vehiculo.id_vehiculo;
        document.getElementById('matricula').value = vehiculo.matricula || '';
        document.getElementById('marca').value = vehiculo.marca || '';
        document.getElementById('modelo').value = vehiculo.modelo || '';
        if (inputAnio) {
            inputAnio.value = String(vehiculo.anio || '');
        }
        if (yearList) {
            Array.from(yearList.querySelectorAll('.year-option')).forEach((el) => {
                el.classList.toggle('selected', el.dataset.year === String(vehiculo.anio));
            });
        }
        if (inputKilometraje) {
            inputKilometraje.value = vehiculo.kilometraje ?? 0;
        }
        if (btnGuardarVehiculo) {
            btnGuardarVehiculo.textContent = 'Actualizar Vehículo';
        }
        if (btnCancelarVehiculo) {
            btnCancelarVehiculo.classList.remove('hidden');
        }
        recalcularAlturaActual();
    }

    function limpiarFormularioVehiculo() {
        if (formVehiculo) {
            formVehiculo.reset();
        }
        document.getElementById('idVehiculo').value = '';
        if (inputKilometraje) {
            inputKilometraje.value = 0;
        }
        if (yearList) {
            Array.from(yearList.querySelectorAll('.year-option')).forEach((el) => {
                el.classList.remove('selected');
            });
        }
        if (btnGuardarVehiculo) {
            btnGuardarVehiculo.textContent = 'Guardar Vehículo';
        }
        if (btnCancelarVehiculo) {
            btnCancelarVehiculo.classList.add('hidden');
        }
    }

    function renderizarVehiculos(vehiculos) {
        if (tablaVehiculos) {
            tablaVehiculos.innerHTML = '';
            vehiculos.forEach((v) => {
                const tr = document.createElement('tr');

                const tdMat = document.createElement('td');
                tdMat.textContent = v.matricula;

                const tdMarca = document.createElement('td');
                tdMarca.textContent = v.marca;

                const tdModelo = document.createElement('td');
                tdModelo.textContent = v.modelo;

                const tdAnio = document.createElement('td');
                tdAnio.textContent = v.anio;

                const tdKm = document.createElement('td');
                tdKm.textContent = (Number(v.kilometraje) || 0).toLocaleString('es-ES') + ' km';

                const tdAcciones = document.createElement('td');
                const contenedorAcciones = document.createElement('div');
                contenedorAcciones.className = 'actions-row';
                contenedorAcciones.style.marginTop = '0';
                contenedorAcciones.style.justifyContent = 'flex-start';

                const btnEditar = document.createElement('button');
                btnEditar.type = 'button';
                btnEditar.className = 'btn btn-sm';
                btnEditar.textContent = 'Editar';
                btnEditar.addEventListener('click', () => {
                    ocultarAlerta();
                    prepararEdicionVehiculo(v);
                });

                const btnEliminar = document.createElement('button');
                btnEliminar.type = 'button';
                btnEliminar.className = 'btn btn-danger btn-sm';
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.addEventListener('click', async () => {
                    ocultarAlerta();
                    try {
                        const res = await peticionSW(VEHICULO_ENDPOINT, {
                            action: 'eliminar',
                            id_vehiculo: v.id_vehiculo
                        });
                        if (res && res.success) {
                            limpiarFormularioVehiculo();
                            await cargarVehiculos();
                            await cargarCitasYFacturas();
                            mostrarAlerta(res.msg || 'Vehículo eliminado.', 'success');
                        } else {
                            mostrarAlerta((res && res.msg) || 'No se pudo eliminar el vehículo.', 'error');
                        }
                    } catch (err) {
                        mostrarAlerta('Error de conexión al eliminar el vehículo.', 'error');
                    }
                });

                contenedorAcciones.appendChild(btnEditar);
                contenedorAcciones.appendChild(btnEliminar);
                tdAcciones.appendChild(contenedorAcciones);

                tr.appendChild(tdMat);
                tr.appendChild(tdMarca);
                tr.appendChild(tdModelo);
                tr.appendChild(tdAnio);
                tr.appendChild(tdKm);
                tr.appendChild(tdAcciones);

                tablaVehiculos.appendChild(tr);
            });
        }

        if (selectCitaVehiculo) {
            const valorPrevio = selectCitaVehiculo.value;
            selectCitaVehiculo.innerHTML = '<option value="">Seleccione un vehículo</option>';
            vehiculos.forEach((v) => {
                const opt = document.createElement('option');
                opt.value = v.id_vehiculo;
                opt.textContent = `${v.marca} ${v.modelo} (${v.matricula})`;
                selectCitaVehiculo.appendChild(opt);
            });
            if (valorPrevio && vehiculos.some((v) => String(v.id_vehiculo) === String(valorPrevio))) {
                selectCitaVehiculo.value = valorPrevio;
            }
        }

        recalcularAlturaActual();
    }

    function renderizarCitas(citas) {
        if (!tablaCitas) return;
        tablaCitas.innerHTML = '';

        citas.forEach((c) => {
            const tr = document.createElement('tr');

            const tdId = document.createElement('td');
            tdId.textContent = '#' + c.id_cita;

            const tdVehiculo = document.createElement('td');
            tdVehiculo.textContent = c.marca ? `${c.marca} ${c.modelo} (${c.matricula})` : `Vehículo #${c.id_vehiculo}`;

            const tdFecha = document.createElement('td');
            tdFecha.textContent = formatearFechaHora(c.fecha_cita);

            const tdMotivo = document.createElement('td');
            tdMotivo.textContent = c.motivo || '-';

            const tdEstado = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = String(c.estado || 'pendiente').replace('_', ' ').toUpperCase();
            tdEstado.appendChild(badge);

            if (c.estado === 'pendiente') {
                const btnCancelarCita = document.createElement('button');
                btnCancelarCita.type = 'button';
                btnCancelarCita.className = 'btn btn-danger btn-sm';
                btnCancelarCita.style.marginLeft = '8px';
                btnCancelarCita.textContent = 'Cancelar';
                btnCancelarCita.addEventListener('click', async () => {
                    ocultarAlerta();
                    try {
                        const res = await peticionSW(CITA_ENDPOINT, {
                            action: 'cancelar',
                            id_cita: c.id_cita
                        });
                        if (res && res.success) {
                            await cargarCitasYFacturas();
                            mostrarAlerta(res.msg || 'Cita cancelada.', 'success');
                        } else {
                            mostrarAlerta((res && res.msg) || 'No se pudo cancelar la cita.', 'error');
                        }
                    } catch (err) {
                        mostrarAlerta('Error de conexión al cancelar la cita.', 'error');
                    }
                });
                tdEstado.appendChild(btnCancelarCita);
            }

            const tdHoras = document.createElement('td');
            tdHoras.textContent = (Number(c.horas_trabajo) || 0).toFixed(2) + ' h';

            const tdMateriales = document.createElement('td');
            tdMateriales.textContent = c.materiales_usados || 'Sin materiales';

            tr.appendChild(tdId);
            tr.appendChild(tdVehiculo);
            tr.appendChild(tdFecha);
            tr.appendChild(tdMotivo);
            tr.appendChild(tdEstado);
            tr.appendChild(tdHoras);
            tr.appendChild(tdMateriales);

            tablaCitas.appendChild(tr);
        });

        recalcularAlturaActual();
    }

    function renderizarFacturas(facturas) {
        if (!tablaFacturas) return;
        tablaFacturas.innerHTML = '';

        facturas.forEach((f) => {
            const tr = document.createElement('tr');

            const tdNum = document.createElement('td');
            tdNum.textContent = f.numero_factura;

            const tdFecha = document.createElement('td');
            tdFecha.textContent = formatearFechaHora(f.fecha_emision);

            const tdManoObra = document.createElement('td');
            tdManoObra.textContent = formatearMoneda(f.importe_mano_obra);

            const tdRepuestos = document.createElement('td');
            tdRepuestos.textContent = formatearMoneda(f.importe_repuestos);

            const tdSubtotal = document.createElement('td');
            tdSubtotal.textContent = formatearMoneda(f.subtotal);

            const tdIva = document.createElement('td');
            tdIva.textContent = formatearMoneda(f.iva);

            const tdTotal = document.createElement('td');
            tdTotal.style.fontWeight = '700';
            tdTotal.textContent = formatearMoneda(f.total);

            const tdEstado = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = f.pagada ? 'PAGADA' : 'PENDIENTE';
            tdEstado.appendChild(badge);

            tr.appendChild(tdNum);
            tr.appendChild(tdFecha);
            tr.appendChild(tdManoObra);
            tr.appendChild(tdRepuestos);
            tr.appendChild(tdSubtotal);
            tr.appendChild(tdIva);
            tr.appendChild(tdTotal);
            tr.appendChild(tdEstado);

            tablaFacturas.appendChild(tr);
        });

        recalcularAlturaActual();
    }

    async function cargarVehiculos() {
        try {
            const res = await peticionSW(VEHICULO_ENDPOINT, { action: 'listar' });
            if (res && res.success && Array.isArray(res.data)) {
                renderizarVehiculos(res.data);
            }
        } catch (err) {
        }
    }

    async function cargarCitasYFacturas() {
        try {
            const res = await peticionSW(CITA_ENDPOINT, { action: 'listar' });
            if (res && res.success && res.data) {
                renderizarCitas(Array.isArray(res.data.citas) ? res.data.citas : []);
                renderizarFacturas(Array.isArray(res.data.facturas) ? res.data.facturas : []);
            }
        } catch (err) {
        }
    }

    function rellenarDatosUsuarioUI(usuario, cliente) {
        if (nombreUsuarioActivo) {
            if (cliente && (cliente.nombre || cliente.apellidos)) {
                nombreUsuarioActivo.textContent = `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim();
            } else if (usuario && usuario.username) {
                nombreUsuarioActivo.textContent = usuario.username;
            }
        }

        const cfgUsername = document.getElementById('cfgUsername');
        const cfgEmail = document.getElementById('cfgEmail');
        const cfgNombre = document.getElementById('cfgNombre');
        const cfgApellidos = document.getElementById('cfgApellidos');
        const cfgDni = document.getElementById('cfgDni');
        const cfgTelefono = document.getElementById('cfgTelefono');
        const cfgDireccion = document.getElementById('cfgDireccion');
        const cfgPassword = document.getElementById('cfgPassword');

        if (usuario) {
            if (cfgUsername) cfgUsername.value = usuario.username || '';
            if (cfgEmail) cfgEmail.value = usuario.email || '';
        }
        if (cliente) {
            if (cfgNombre) cfgNombre.value = cliente.nombre || '';
            if (cfgApellidos) cfgApellidos.value = cliente.apellidos || '';
            if (cfgDni) cfgDni.value = cliente.dni || '';
            if (cfgTelefono) cfgTelefono.value = cliente.telefono || '';
            if (cfgDireccion) cfgDireccion.value = cliente.direccion || '';
        }
        if (cfgPassword) {
            cfgPassword.value = '';
        }
    }

    async function verificarAccesoCliente() {
        const token = obtenerToken();
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const usuarioLocal = obtenerUsuarioSesion();
        const clienteLocal = obtenerClienteSesion();
        if (usuarioLocal) {
            rellenarDatosUsuarioUI(usuarioLocal, clienteLocal);
        }

        try {
            const res = await peticionSW(AUTH_ENDPOINT, { action: 'validar_token' });
            if (!res || !res.success || !res.data || !res.data.usuario) {
                limpiarSesion();
                window.location.href = 'index.html';
                return;
            }
            actualizarDatosSesion(res.data);
            rellenarDatosUsuarioUI(res.data.usuario, res.data.cliente);
            await Promise.all([cargarVehiculos(), cargarCitasYFacturas()]);
        } catch (err) {
            limpiarSesion();
            window.location.href = 'index.html';
        }
    }

    window.addEventListener('motorfix:alerta', () => {
        if (!animando && clienteSlider && secciones[indiceActual]) {
            clienteSlider.style.height = calcularAlturaSeccion(secciones[indiceActual]) + 'px';
            fijarAlturaSlot(secciones[indiceActual]);
        }
    });

    verificarAccesoCliente();

    if (formConfigUsuario) {
        formConfigUsuario.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarAlerta();

            const payload = {
                action: 'actualizar_perfil',
                username: document.getElementById('cfgUsername').value.trim(),
                email: document.getElementById('cfgEmail').value.trim(),
                nombre: document.getElementById('cfgNombre').value.trim(),
                apellidos: document.getElementById('cfgApellidos').value.trim(),
                dni: document.getElementById('cfgDni').value.trim(),
                telefono: document.getElementById('cfgTelefono').value.trim(),
                direccion: document.getElementById('cfgDireccion').value.trim(),
                password: document.getElementById('cfgPassword').value
            };

            try {
                const res = await peticionSW(AUTH_ENDPOINT, payload);
                if (res && res.success && res.data && res.data.usuario) {
                    actualizarDatosSesion(res.data);
                    rellenarDatosUsuarioUI(res.data.usuario, res.data.cliente);
                    cerrarModalConfig();
                    mostrarAlerta(res.msg || 'Configuración de usuario guardada correctamente.', 'success');
                } else {
                    cerrarModalConfig();
                    mostrarAlerta((res && res.msg) || 'No se pudo actualizar el perfil.', 'error');
                }
            } catch (err) {
                cerrarModalConfig();
                mostrarAlerta('Error de conexión al guardar la configuración.', 'error');
            }
        });
    }

    document.addEventListener('mousedown', (e) => {
        if (yearControl && !yearControl.contains(e.target)) {
            cerrarSelectorAnio();
        }
        if (datetimeControl && !datetimeControl.contains(e.target)) {
            cerrarSelectorCita();
        }
        if (userMenu && !userMenu.contains(e.target)) {
            cerrarMenuUsuario();
        }
    });

    if (formVehiculo) {
        formVehiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarAlerta();

            const idVehiculo = document.getElementById('idVehiculo').value.trim();
            const matricula = document.getElementById('matricula').value.trim();
            const marca = document.getElementById('marca').value.trim();
            const modelo = document.getElementById('modelo').value.trim();
            const anio = parseInt(document.getElementById('anio').value, 10);
            const kilometraje = parseInt(document.getElementById('kilometraje').value, 10) || 0;

            if (!anio || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
                mostrarAlerta(`Seleccione un año válido entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`, 'error');
                return;
            }

            const payload = {
                action: idVehiculo ? 'actualizar' : 'crear',
                id_vehiculo: idVehiculo || undefined,
                matricula,
                marca,
                modelo,
                anio,
                kilometraje
            };

            try {
                const res = await peticionSW(VEHICULO_ENDPOINT, payload);
                if (res && res.success) {
                    limpiarFormularioVehiculo();
                    await cargarVehiculos();
                    mostrarAlerta(res.msg || 'Vehículo guardado correctamente.', 'success');
                } else {
                    mostrarAlerta((res && res.msg) || 'No se pudo guardar el vehículo.', 'error');
                }
            } catch (err) {
                mostrarAlerta('Error de conexión al guardar el vehículo.', 'error');
            }
        });
    }

    if (btnCancelarVehiculo && formVehiculo) {
        btnCancelarVehiculo.addEventListener('click', () => {
            ocultarAlerta();
            limpiarFormularioVehiculo();
            recalcularAlturaActual();
        });
    }

    if (formCita) {
        formCita.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarAlerta();

            const idVehiculo = document.getElementById('citaVehiculo').value;
            const fechaCita = document.getElementById('fechaCita').value.trim();
            const motivo = document.getElementById('motivoCita').value.trim();

            if (!idVehiculo || !fechaCita || !motivo) {
                mostrarAlerta('Seleccione un vehículo, una fecha/hora y describa el motivo.', 'error');
                return;
            }

            try {
                const res = await peticionSW(CITA_ENDPOINT, {
                    action: 'crear',
                    id_vehiculo: idVehiculo,
                    fecha_cita: fechaCita,
                    motivo
                });

                if (res && res.success) {
                    formCita.reset();
                    fechaCitaInput.value = '';
                    fechaCitaDisplay.value = '';
                    fechaSeleccionada = null;
                    renderizarCalendarioCita();
                    await cargarCitasYFacturas();
                    mostrarAlerta(res.msg || 'Cita solicitada correctamente.', 'success');
                    cambiarSeccion(2, false);
                } else {
                    mostrarAlerta((res && res.msg) || 'No se pudo solicitar la cita.', 'error');
                }
            } catch (err) {
                mostrarAlerta('Error de conexión al solicitar la cita.', 'error');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await peticionSW(AUTH_ENDPOINT, { action: 'logout' });
            } catch (err) {
            }
            limpiarSesion();
            window.location.href = 'index.html';
        });
    }
});
