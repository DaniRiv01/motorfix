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

    document.addEventListener('mousedown', (e) => {
        if (yearControl && !yearControl.contains(e.target)) {
            cerrarSelectorAnio();
        }
        if (datetimeControl && !datetimeControl.contains(e.target)) {
            cerrarSelectorCita();
        }
    });

    if (formVehiculo) {
        formVehiculo.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    if (btnCancelarVehiculo && formVehiculo) {
        btnCancelarVehiculo.addEventListener('click', () => {
            formVehiculo.reset();
            document.getElementById('idVehiculo').value = '';
            btnCancelarVehiculo.classList.add('hidden');
        });
    }

    if (formCita) {
        formCita.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
