


document.addEventListener('DOMContentLoaded', () => {
    // Credenciales almacenadas
    const netflixCredentials = {
        email: "willintongestradasovicobe@gmail.com",
        password: "asovicobe2025+",
        lastUpdated: "29/06/2025"
    };
    
    // Elementos del DOM
    const emailElement = document.getElementById('email-value');
    const passwordElement = document.getElementById('password-value');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const copyEmailBtn = document.getElementById('copy-email');
    const copyPasswordBtn = document.getElementById('copy-password');
    const lastUpdatedElement = document.getElementById('last-updated');
    
    // Variables para el temporizador
    let passwordVisible = false;
    let passwordTimer = null;
    
    // Mostrar última actualización
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = netflixCredentials.lastUpdated;
    }
    
    // Mostrar credenciales iniciales
    emailElement.textContent = netflixCredentials.email;
    passwordElement.textContent = '•'.repeat(netflixCredentials.password.length);
    
    // Función para mostrar modal personalizado
    function showModal(message, type = 'info', duration = 3000) {
        // Crear el modal si no existe
        let modal = document.getElementById('custom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-modal';
            modal.className = 'custom-modal';
            document.body.appendChild(modal);
            
            // Agregar estilos del modal al head si no existen
            if (!document.getElementById('modal-styles')) {
                const modalStyles = document.createElement('style');
                modalStyles.id = 'modal-styles';
                modalStyles.textContent = `
                    .custom-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2000;
                        visibility: hidden;
                        opacity: 0;
                        transition: visibility 0.3s ease, opacity 0.3s ease;
                    }
                    
                    .custom-modal.show {
                        visibility: visible;
                        opacity: 1;
                    }
                    
                    .modal-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        backdrop-filter: blur(8px);
                        animation: fadeIn 0.3s ease;
                    }
                    
                    .modal-content {
                        position: relative;
                        background: linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(15, 15, 15, 0.99) 100%);
                        backdrop-filter: blur(10px);
                        border-radius: 28px;
                        padding: 32px;
                        max-width: 400px;
                        width: 90%;
                        text-align: center;
                        border: 1px solid rgba(229, 9, 20, 0.3);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                        transform: scale(0.9);
                        animation: modalPopIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
                    }
                    
                    @keyframes modalPopIn {
                        from {
                            transform: scale(0.9);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes modalPopOut {
                        from {
                            transform: scale(1);
                            opacity: 1;
                        }
                        to {
                            transform: scale(0.9);
                            opacity: 0;
                        }
                    }
                    
                    .modal-icon {
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 20px;
                        background: linear-gradient(135deg, #E50914, #B81A24);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: iconPulse 0.5s ease;
                    }
                    
                    @keyframes iconPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                    
                    .modal-icon i {
                        font-size: 2.5rem;
                        color: white;
                    }
                    
                    .modal-title {
                        color: white;
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }
                    
                    .modal-message {
                        color: #b3b3b3;
                        font-size: 1rem;
                        line-height: 1.5;
                        margin-bottom: 24px;
                    }
                    
                    .modal-timer {
                        color: #E50914;
                        font-size: 0.9rem;
                        font-weight: 600;
                        margin-bottom: 20px;
                        padding: 8px;
                        background: rgba(229, 9, 20, 0.1);
                        border-radius: 12px;
                        display: inline-block;
                    }
                    
                    .modal-button {
                        background: linear-gradient(135deg, #E50914, #B81A24);
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 12px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
                    }
                    
                    .modal-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(229, 9, 20, 0.4);
                    }
                    
                    .modal-button:active {
                        transform: translateY(0);
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `;
                document.head.appendChild(modalStyles);
            }
        }
        
        // Configurar icono según tipo
        let iconClass = 'fas fa-info-circle';
        let title = '';
        
        switch(type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                title = '¡Éxito!';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                title = 'Atención';
                break;
            case 'error':
                iconClass = 'fas fa-times-circle';
                title = 'Error';
                break;
            case 'info':
            default:
                iconClass = 'fas fa-eye-slash';
                title = 'Contraseña Ocultada';
                break;
        }
        
        // Construir contenido del modal
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-icon">
                    <i class="${iconClass}"></i>
                </div>
                <h3 class="modal-title">${title}</h3>
                <p class="modal-message">${message}</p>
                ${type === 'info' ? '<div class="modal-timer">🕐 Cerrando en 10 segundos...</div>' : ''}
                <button class="modal-button" id="modal-close-btn">Entendido</button>
            </div>
        `;
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Función para cerrar modal
        const closeModal = () => {
            const modalContent = modal.querySelector('.modal-content');
            modalContent.style.animation = 'modalPopOut 0.2s ease forwards';
            setTimeout(() => {
                modal.classList.remove('show');
                modal.innerHTML = '';
            }, 200);
        };
        
        // Evento para cerrar modal
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // Cerrar al hacer clic en el overlay
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
        



        // Auto-cerrar después de 10 segundos
        let timerCountdown = 10;
        const timerElement = modal.querySelector('.modal-timer');
        
        const autoCloseInterval = setInterval(() => {
            if (timerCountdown > 1 && timerElement && modal.classList.contains('show')) {
                timerCountdown--;
                timerElement.textContent = `🕐 Cerrando en ${timerCountdown} segundos...`;
            } else {
                clearInterval(autoCloseInterval);
                if (modal.classList.contains('show')) {
                    closeModal();
                }

            }
        }, 1000);


        
        // Limpiar intervalo si se cierra manualmente
        const originalClose = closeModal;
        window.closeModalWithCleanup = () => {
            clearInterval(autoCloseInterval);
            originalClose();
        };
        
        // Sobrescribir closeModal para limpiar intervalo
        const newCloseBtn = document.getElementById('modal-close-btn');
        if (newCloseBtn) {
            newCloseBtn.onclick = () => {
                clearInterval(autoCloseInterval);
                closeModal();
            };
        }
        
        if (overlay) {
            overlay.onclick = () => {
                clearInterval(autoCloseInterval);
                closeModal();
            };
        }
    }
    
    // Función para ocultar contraseña automáticamente
    function autoHidePassword() {
        if (passwordVisible) {
            passwordVisible = false;
            const icon = togglePasswordBtn.querySelector('i');
            const span = togglePasswordBtn.querySelector('span');
            
            icon.className = 'fas fa-eye';
            span.textContent = 'Mostrar';
            passwordElement.textContent = '•'.repeat(netflixCredentials.password.length);
            
            // Mostrar modal personalizado
            showModal('La contraseña se ha ocultado automáticamente por seguridad después de 20 segundos', 'info');
            
            // Limpiar el temporizador
            if (passwordTimer) {
                clearTimeout(passwordTimer);
                passwordTimer = null;
            }
        }
    }
    
    // Función para mostrar contraseña con temporizador
    function showPasswordWithTimer() {
        // Si ya hay un temporizador activo, limpiarlo
        if (passwordTimer) {
            clearTimeout(passwordTimer);
        }
        
        // Mostrar contraseña
        passwordVisible = true;
        const icon = togglePasswordBtn.querySelector('i');
        const span = togglePasswordBtn.querySelector('span');
        
        icon.className = 'fas fa-eye-slash';
        span.textContent = 'Ocultar';
        passwordElement.textContent = netflixCredentials.password;
        
        // Animación de revelación
        passwordElement.style.animation = 'none';
        passwordElement.offsetHeight;
        passwordElement.style.animation = 'fadeIn 0.3s ease';
        
        // Mostrar notificación de toast (pequeña)
        showToast('🔓 Contraseña visible - Se ocultará en 20 segundos', 'info', 3000);
        
        // Configurar temporizador para ocultar después de 20 segundos
        passwordTimer = setTimeout(() => {
            autoHidePassword();
        }, 20000); // 20 segundos
    }
    
    // Función para ocultar contraseña manualmente
    function hidePasswordManually() {
        if (passwordTimer) {
            clearTimeout(passwordTimer);
            passwordTimer = null;
        }
        
        passwordVisible = false;
        const icon = togglePasswordBtn.querySelector('i');
        const span = togglePasswordBtn.querySelector('span');
        
        icon.className = 'fas fa-eye';
        span.textContent = 'Mostrar';
        passwordElement.textContent = '•'.repeat(netflixCredentials.password.length);
        
        // Mostrar modal personalizado
        showModal('Has ocultado la contraseña manualmente', 'info');
    }
    
    // Función para mostrar toast (notificación pequeña)
    function showToast(message, type = 'success', duration = 2000) {
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast';
            document.body.appendChild(toast);
            
            // Agregar estilos del toast si no existen
            if (!document.getElementById('toast-styles')) {
                const toastStyles = document.createElement('style');
                toastStyles.id = 'toast-styles';
                toastStyles.textContent = `
                    .toast {
                        position: fixed;
                        bottom: 30px;
                        left: 50%;
                        transform: translateX(-50%) translateY(100px);
                        background: rgba(20, 20, 20, 0.95);
                        backdrop-filter: blur(10px);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 50px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        z-index: 1000;
                        transition: transform 0.3s ease;
                        border: 1px solid rgba(229, 9, 20, 0.3);
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                        font-size: 0.9rem;
                    }
                    
                    .toast.show {
                        transform: translateX(-50%) translateY(0);
                    }
                    
                    .toast i {
                        color: #E50914;
                        font-size: 1.1rem;
                    }
                    
                    @media (max-width: 480px) {
                        .toast {
                            font-size: 0.8rem;
                            padding: 10px 20px;
                            max-width: 90%;
                            text-align: center;
                        }
                    }
                `;
                document.head.appendChild(toastStyles);
            }
        }
        
        const toastMessage = document.getElementById('toast-message') || (() => {
            const span = document.createElement('span');
            span.id = 'toast-message';
            toast.appendChild(span);
            return span;
        })();
        
        const toastIcon = toast.querySelector('i') || (() => {
            const icon = document.createElement('i');
            toast.insertBefore(icon, toast.firstChild);
            return icon;
        })();
        
        // Cambiar icono según tipo
        if (type === 'success') {
            toastIcon.className = 'fas fa-check-circle';
        } else if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle';
        } else if (type === 'info') {
            toastIcon.className = 'fas fa-info-circle';
        }
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
    
    // Función para copiar texto
    async function copyToClipboard(text, element, type) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Efecto visual en el botón
            const originalHTML = element.innerHTML;
            
            element.innerHTML = '<i class="fas fa-check"></i><span>Copiado!</span>';
            element.style.background = '#E50914';
            element.style.color = 'white';
            
            setTimeout(() => {
                element.innerHTML = originalHTML;
                element.style.background = '';
                element.style.color = '';
            }, 1500);
            
            showToast(`${type === 'email' ? 'Correo' : 'Contraseña'} copiado al portapapeles`, 'success');
            
            // Animación en el valor de la credencial
            const valueElement = type === 'email' ? emailElement : passwordElement;
            valueElement.style.transform = 'scale(1.02)';
            setTimeout(() => {
                valueElement.style.transform = '';
            }, 200);
            
        } catch (err) {
            showToast('Error al copiar', 'error');
            console.error('Error al copiar: ', err);
        }
    }
    
    // Evento del botón toggle con nueva lógica
    togglePasswordBtn.addEventListener('click', () => {
        if (passwordVisible) {
            // Si está visible, ocultar manualmente
            hidePasswordManually();
        } else {
            // Si está oculta, mostrar con temporizador
            showPasswordWithTimer();
        }
        
        // Animación de pulsación
        togglePasswordBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            togglePasswordBtn.style.transform = '';
        }, 150);
    });
    
    // Copiar email
    copyEmailBtn.addEventListener('click', () => {
        copyToClipboard(netflixCredentials.email, copyEmailBtn, 'email');
    });
    
    // Copiar contraseña
    copyPasswordBtn.addEventListener('click', () => {
        const passwordToCopy = netflixCredentials.password;
        copyToClipboard(passwordToCopy, copyPasswordBtn, 'password');
    });
    
    // Animación de entrada para las tarjetas
    const cards = document.querySelectorAll('.credential-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, index * 100);
    });
    
    // Limpiar temporizador si la página se cierra
    window.addEventListener('beforeunload', () => {
        if (passwordTimer) {
            clearTimeout(passwordTimer);
        }
    });
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        showToast('🔒 Credenciales seguras - La contraseña se ocultará automáticamente', 'info', 4000);
    }, 1000);
});

// Agregar estilos de animación faltantes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .credential-value {
        transition: transform 0.2s ease;
    }
    
    .action-btn {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;
document.head.appendChild(style);