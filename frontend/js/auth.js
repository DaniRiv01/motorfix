document.addEventListener('DOMContentLoaded', () => {
    const authSlot = document.getElementById('authSlot');
    const authWrapper = document.querySelector('.auth-wrapper');
    const tabsContainer = document.querySelector('.tabs');
    const authSlider = document.querySelector('.auth-slider');
    const authTrack = document.getElementById('authTrack');
    const barraTirador = document.getElementById('barraTirador');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const seccionLogin = document.getElementById('seccionLogin');
    const seccionRegistro = document.getElementById('seccionRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');

    let animando = false;
    let arrastrando = false;
    let startY = 0;
    let alturaInicial = 0;
    let alturaActual = 0;

    function getSeccionActiva() {
        return tabsContainer.classList.contains('registro-active') ? seccionRegistro : seccionLogin;
    }

    function getSeccionInactiva() {
        return tabsContainer.classList.contains('registro-active') ? seccionLogin : seccionRegistro;
    }

    function fijarAlturaSlot(seccion) {
        if (!authSlot || !authWrapper || !authSlider) return;
        const alturaExtraWrapper = authWrapper.offsetHeight - authSlider.offsetHeight;
        authSlot.style.height = (seccion.offsetHeight + alturaExtraWrapper) + 'px';
    }

    if (authSlider && seccionLogin) {
        authSlider.style.height = seccionLogin.offsetHeight + 'px';
        fijarAlturaSlot(seccionLogin);
    }

    function desplegarOtroFormulario() {
        animando = true;
        ocultarAlerta();

        const haciaRegistro = !tabsContainer.classList.contains('registro-active');
        const seccionNueva = getSeccionInactiva();

        authSlider.style.height = '0px';
        fijarAlturaSlot(seccionNueva);

        if (haciaRegistro) {
            tabsContainer.classList.add('registro-active');
            authTrack.classList.add('registro-active');
            tabRegistro.classList.add('active');
            tabLogin.classList.remove('active');
        } else {
            tabsContainer.classList.remove('registro-active');
            authTrack.classList.remove('registro-active');
            tabLogin.classList.add('active');
            tabRegistro.classList.remove('active');
        }

        setTimeout(() => {
            authSlider.style.height = seccionNueva.offsetHeight + 'px';

            setTimeout(() => {
                animando = false;
            }, 280);
        }, 300);
    }

    function cambiarPestanaPorClick(haciaRegistro) {
        if (animando || arrastrando) return;
        animando = true;
        ocultarAlerta();

        const seccionActual = getSeccionActiva();
        const seccionNueva = haciaRegistro ? seccionRegistro : seccionLogin;

        fijarAlturaSlot(seccionActual);
        authSlider.style.height = seccionActual.offsetHeight + 'px';
        authSlider.offsetHeight;
        authSlider.style.height = '0px';

        setTimeout(() => {
            fijarAlturaSlot(seccionNueva);
            if (haciaRegistro) {
                tabsContainer.classList.add('registro-active');
                authTrack.classList.add('registro-active');
                tabRegistro.classList.add('active');
                tabLogin.classList.remove('active');
            } else {
                tabsContainer.classList.remove('registro-active');
                authTrack.classList.remove('registro-active');
                tabLogin.classList.add('active');
                tabRegistro.classList.remove('active');
            }

            setTimeout(() => {
                authSlider.style.height = seccionNueva.offsetHeight + 'px';

                setTimeout(() => {
                    animando = false;
                }, 280);
            }, 300);
        }, 280);
    }

    function iniciarArrastre(clientY) {
        if (animando) return;
        arrastrando = true;
        startY = clientY;
        const seccionActiva = getSeccionActiva();
        alturaInicial = seccionActiva.offsetHeight;
        alturaActual = alturaInicial;
        fijarAlturaSlot(seccionActiva);
        authSlider.classList.add('dragging');
    }

    function moverArrastre(clientY) {
        if (!arrastrando) return;
        const deltaY = clientY - startY;
        alturaActual = Math.max(0, Math.min(alturaInicial, alturaInicial + deltaY));
        authSlider.style.height = alturaActual + 'px';
    }

    function finalizarArrastre() {
        if (!arrastrando) return;
        arrastrando = false;
        authSlider.classList.remove('dragging');

        if (alturaActual <= 8) {
            desplegarOtroFormulario();
        } else {
            animando = true;
            authSlider.style.height = alturaInicial + 'px';
            setTimeout(() => {
                animando = false;
            }, 280);
        }
    }

    if (barraTirador && authSlider) {
        barraTirador.addEventListener('mousedown', (e) => {
            e.preventDefault();
            iniciarArrastre(e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            moverArrastre(e.clientY);
        });

        window.addEventListener('mouseup', () => {
            finalizarArrastre();
        });

        barraTirador.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                iniciarArrastre(e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (arrastrando && e.touches.length > 0) {
                moverArrastre(e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            finalizarArrastre();
        });
    }

    if (tabLogin && tabRegistro) {
        tabLogin.addEventListener('click', () => {
            if (tabLogin.classList.contains('active')) return;
            cambiarPestanaPorClick(false);
        });

        tabRegistro.addEventListener('click', () => {
            if (tabRegistro.classList.contains('active')) return;
            cambiarPestanaPorClick(true);
        });
    }

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }
});
