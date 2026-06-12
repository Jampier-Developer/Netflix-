/* ================================================================
   CREDENCIALES CIFRADAS CON AES-256-GCM
   Las credenciales NUNCA aparecen en texto plano en este archivo.
   Son descifradas en memoria usando la contraseña de acceso como
   clave — sin la clave correcta son datos ilegibles.
================================================================ */
var ENC_EMAIL = 'AZCiykRzzml4HYkADHn8VBbxZyQF7Pft13AQk5upv9pCOz5aOD8EpizErQWNIEBJyVQFmlyQrVH6zXfbzzxW';
var ENC_PASS  = 'gNWupWzkr5HXcq4lhKav5qxXs5e2syF+if0ubKZpymZ4zQEOYEG8bG6F';
var ENC_DATE  = '7nh0/iK0ZOvzYwKe2+biYz2sdQP1UR+4GPNVidNgywm0/LcnSDg=';

/* ================================================================
   DESCIFRADO — Web Crypto API (AES-256-GCM + PBKDF2-SHA256)
   Formato: base64( iv[12] | ciphertext[N] | authTag[16] )
================================================================ */
async function tryUnlock(password) {
    try {
        var enc = new TextEncoder();
        var raw = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        var key = await crypto.subtle.deriveKey(
            { name:'PBKDF2', salt:enc.encode('nfxvault2025salt'), iterations:100000, hash:'SHA-256' },
            raw, { name:'AES-GCM', length:256 }, false, ['decrypt']
        );
        async function dec(b64) {
            var d  = Uint8Array.from(atob(b64), function(c){ return c.charCodeAt(0); });
            var iv = d.slice(0, 12);
            var ct = d.slice(12); // ciphertext + authTag (últimos 16 bytes)
            var p  = await crypto.subtle.decrypt({ name:'AES-GCM', iv:iv }, key, ct);
            return new TextDecoder().decode(p);
        }
        return {
            email:       await dec(ENC_EMAIL),
            password:    await dec(ENC_PASS),
            lastUpdated: await dec(ENC_DATE)
        };
    } catch(e) {
        return null; // contraseña incorrecta → AES-GCM falla verificación
    }
}

/* ================================================================
   BLOQUEO POR INTENTOS (persiste en localStorage)
================================================================ */
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS   = 30 * 60 * 1000;

function getAttempts()     { return parseInt(localStorage.getItem('nfx_a') || '0'); }
function incAttempts()     { var n = getAttempts()+1; localStorage.setItem('nfx_a',n); return n; }
function clearAttempts()   { localStorage.removeItem('nfx_a'); localStorage.removeItem('nfx_l'); }
function setLockout()      { localStorage.setItem('nfx_l', Date.now()+LOCKOUT_MS); localStorage.setItem('nfx_a',MAX_ATTEMPTS); }
function getLockoutUntil() { return parseInt(localStorage.getItem('nfx_l')||'0'); }
function isLocked()        { return getLockoutUntil() > Date.now(); }

/* ================================================================
   APLICACIÓN PRINCIPAL
================================================================ */
document.addEventListener('DOMContentLoaded', function() {

    var AUTO_HIDE_SECS = 20;
    var vaultCreds     = null;

    // Referencias a elementos del vault (pueden reasignarse tras logout)
    var emailEl       = document.getElementById('email-value');
    var passwordEl    = document.getElementById('password-value');
    var toggleBtn     = document.getElementById('toggle-password');
    var copyEmailBtn  = document.getElementById('copy-email');
    var copyPassBtn   = document.getElementById('copy-password');
    var lastUpdatedEl = document.getElementById('last-updated');
    var timerBar      = document.getElementById('timer-bar');
    var timerBarFill  = document.getElementById('timer-bar-fill');
    var timerBarText  = document.getElementById('timer-bar-text');

    var passwordVisible = false;
    var hideTimer       = null;
    var barInterval     = null;

    /* ──────────────────────────────────────────
       TOAST
    ────────────────────────────────────────── */
    function showToast(msg, type, ms) {
        if (!type) type='success'; if (!ms) ms=2000;
        var t  = document.getElementById('toast-notification');
        var tm = document.getElementById('toast-message');
        var ti = t.querySelector('i');
        var im = {success:'fas fa-check-circle',error:'fas fa-exclamation-circle',info:'fas fa-info-circle'};
        ti.className = im[type]||im.success;
        tm.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._t);
        t._t = setTimeout(function(){ t.classList.remove('show'); }, ms);
    }

    /* ──────────────────────────────────────────
       MODAL (contraseña ocultada)
    ────────────────────────────────────────── */
    function showModal(msg, type) {
        if (!type) type='info';
        var m  = document.getElementById('custom-modal');
        var ic = {success:'fas fa-check-circle',warning:'fas fa-exclamation-triangle',error:'fas fa-times-circle',info:'fas fa-eye-slash'};
        var ti = {success:'¡Éxito!',warning:'Atención',error:'Error',info:'Contraseña Ocultada'};
        var isInfo = (type==='info');
        var cd = isInfo ? 10 : 3;

        m.innerHTML =
            '<div class="modal-overlay"></div>' +
            '<div class="modal-content">' +
              '<div class="modal-icon"><i class="'+(ic[type]||ic.info)+'"></i></div>' +
              '<h3 class="modal-title">'+(ti[type]||'Información')+'</h3>' +
              '<p class="modal-message">'+msg+'</p>' +
              (isInfo?'<div class="modal-timer" id="mt">Cerrando en '+cd+' segundos...</div>':'') +
              '<button class="modal-button" id="mc">Entendido</button>' +
            '</div>';

        requestAnimationFrame(function(){ m.classList.add('show'); });
        var te = document.getElementById('mt');
        function close() {
            clearInterval(ac);
            var c = m.querySelector('.modal-content');
            if (c) c.style.animation='modalPopOut .2s ease forwards';
            setTimeout(function(){ m.classList.remove('show'); m.innerHTML=''; }, 200);
        }
        var ac = setInterval(function(){
            cd--;
            if (te) te.textContent='Cerrando en '+cd+' segundo'+(cd!==1?'s':'')+'...';
            if (cd<=0) close();
        }, 1000);
        document.getElementById('mc').addEventListener('click', close);
        m.querySelector('.modal-overlay').addEventListener('click', close);
    }

    /* ──────────────────────────────────────────
       BARRA CUENTA REGRESIVA
    ────────────────────────────────────────── */
    function startBar() {
        timerBar.classList.add('active');
        timerBarFill.style.transition = 'none';
        timerBarFill.style.width = '100%';
        timerBarFill.offsetWidth;
        timerBarFill.style.transition = 'width 1s linear';
        var r = AUTO_HIDE_SECS;
        timerBarText.textContent = r+'s';
        clearInterval(barInterval);
        barInterval = setInterval(function(){
            r--;
            timerBarFill.style.width = ((r/AUTO_HIDE_SECS)*100)+'%';
            timerBarText.textContent = r+'s';
            if (r<=0){ clearInterval(barInterval); barInterval=null; }
        }, 1000);
    }
    function stopBar() {
        clearInterval(barInterval); barInterval=null;
        timerBar.classList.remove('active');
    }

    /* ──────────────────────────────────────────
       CONTRASEÑA: MOSTRAR / OCULTAR
    ────────────────────────────────────────── */
    function hidePassword(auto, silent) {
        if (hideTimer){ clearTimeout(hideTimer); hideTimer=null; }
        passwordVisible = false;
        toggleBtn.querySelector('i').className      = 'fas fa-eye';
        toggleBtn.querySelector('span').textContent = 'Mostrar';
        if (vaultCreds) passwordEl.textContent = '•'.repeat(vaultCreds.password.length);
        stopBar();
        if (!silent) {
            showModal(
                auto ? 'La contraseña se ocultó automáticamente por seguridad después de 20 segundos.'
                     : 'Has ocultado la contraseña manualmente.',
                'info'
            );
        }
    }

    function showPassword() {
        if (!vaultCreds) return;
        if (hideTimer) clearTimeout(hideTimer);
        passwordVisible = true;
        toggleBtn.querySelector('i').className      = 'fas fa-eye-slash';
        toggleBtn.querySelector('span').textContent = 'Ocultar';
        passwordEl.textContent = vaultCreds.password;
        passwordEl.style.animation = 'none';
        passwordEl.offsetHeight;
        passwordEl.style.animation = 'fadeInSlide .3s ease';
        startBar();
        showToast('Contraseña visible · Se ocultará en 20 segundos', 'info', 3000);
        hideTimer = setTimeout(function(){ hidePassword(true, false); }, AUTO_HIDE_SECS*1000);
    }

    /* ──────────────────────────────────────────
       PORTAPAPELES
    ────────────────────────────────────────── */
    function copyTo(text, btn, label) {
        navigator.clipboard.writeText(text).then(function(){
            var i=btn.querySelector('i'), s=btn.querySelector('span');
            var pi=i.className, ps=s.textContent;
            i.className='fas fa-check'; s.textContent='¡Copiado!';
            btn.style.cssText='background:var(--netflix-red);color:white;border-color:var(--netflix-red)';
            setTimeout(function(){ i.className=pi; s.textContent=ps; btn.style.cssText=''; }, 1500);
            showToast(label+' copiado al portapapeles','success');
        }).catch(function(){ showToast('Error al copiar','error'); });
    }

    /* ──────────────────────────────────────────
       INICIALIZAR VAULT (post-login)
    ────────────────────────────────────────── */
    function initVault(creds) {
        vaultCreds = creds;
        lastUpdatedEl.textContent = creds.lastUpdated;
        emailEl.textContent       = creds.email;
        passwordEl.textContent    = '•'.repeat(creds.password.length);

        // Animar tarjetas
        document.querySelectorAll('.credential-card').forEach(function(card, i){
            card.style.opacity='0'; card.style.transform='translateX(-20px)';
            setTimeout(function(){
                card.style.transition='opacity .5s ease, transform .5s ease';
                card.style.opacity='1'; card.style.transform='translateX(0)';
            }, 200+i*130);
        });

        // Listeners de acción — en elementos frescos (sin listeners previos)
        toggleBtn.addEventListener('click', function(){
            if (passwordVisible) hidePassword(false,false); else showPassword();
            toggleBtn.style.transform='scale(.95)';
            setTimeout(function(){ toggleBtn.style.transform=''; }, 150);
        });
        copyEmailBtn.addEventListener('click', function(){ copyTo(creds.email,  copyEmailBtn, 'Correo'); });
        copyPassBtn.addEventListener('click',  function(){ copyTo(creds.password, copyPassBtn, 'Contraseña'); });
    }

    /* ──────────────────────────────────────────
       CERRAR SESIÓN (listener único, fuera de initVault)
    ────────────────────────────────────────── */
    document.getElementById('logout-btn').addEventListener('click', function(){
        if (!vaultCreds) return;

        // Detener temporizadores
        if (hideTimer){ clearTimeout(hideTimer); hideTimer=null; }
        stopBar();
        passwordVisible = false;
        vaultCreds = null;

        // Limpiar DOM
        emailEl.textContent = '';
        passwordEl.textContent = '';
        lastUpdatedEl.textContent = '--/--/----';

        // Clonar botones para borrar sus listeners
        ['toggle-password','copy-email','copy-password'].forEach(function(id){
            var el = document.getElementById(id);
            var fr = el.cloneNode(true);
            el.parentNode.replaceChild(fr, el);
        });
        toggleBtn    = document.getElementById('toggle-password');
        copyEmailBtn = document.getElementById('copy-email');
        copyPassBtn  = document.getElementById('copy-password');

        // Mostrar pantalla de acceso
        var ps = document.getElementById('pin-screen');
        ps.classList.remove('hidden');
        var pi = document.getElementById('pin-input');
        pi.value=''; pi.type='password';
        document.getElementById('pin-toggle-btn').querySelector('i').className='fas fa-eye';
        setTimeout(function(){ pi.focus(); }, 400);

        showToast('Sesión cerrada correctamente','info',3000);
    });

    /* ──────────────────────────────────────────
       MODAL ACCESO CONCEDIDO
    ────────────────────────────────────────── */
    function showAccessGranted(onDone) {
        var modal = document.getElementById('access-modal');
        // Reiniciar animación del ícono clonándolo
        var wrap  = modal.querySelector('.access-icon-wrap');
        var fresh = wrap.cloneNode(true);
        wrap.parentNode.replaceChild(fresh, wrap);

        modal.classList.add('show');
        setTimeout(function(){
            modal.classList.add('fadeout');
            setTimeout(function(){
                modal.classList.remove('show','fadeout');
                if (onDone) onDone();
            }, 500);
        }, 2700);
    }

    /* ──────────────────────────────────────────
       PANTALLA DE ACCESO
    ────────────────────────────────────────── */
    (function initAccess(){
        var screen    = document.getElementById('pin-screen');
        var container = document.getElementById('pin-container');
        var inputEl   = document.getElementById('pin-input');
        var errorEl   = document.getElementById('pin-error');
        var errorText = document.getElementById('pin-error-text');
        var submitBtn = document.getElementById('pin-submit');
        var togglePw  = document.getElementById('pin-toggle-btn');
        var pinForm   = document.getElementById('pin-form');
        var lockoutEl = document.getElementById('pin-lockout');
        var cdEl      = document.getElementById('lockout-countdown');
        var cdInt     = null;

        function showLockUI(until) {
            pinForm.style.display = 'none';
            lockoutEl.classList.add('show');
            errorEl.classList.remove('show');
            function tick(){
                var rem = Math.max(0, until - Date.now());
                if (rem<=0){
                    clearInterval(cdInt);
                    lockoutEl.classList.remove('show');
                    pinForm.style.display='';
                    clearAttempts();
                    setTimeout(function(){ inputEl.focus(); }, 200);
                    return;
                }
                var m=Math.floor(rem/60000), s=Math.floor((rem%60000)/1000);
                cdEl.textContent=('0'+m).slice(-2)+':'+('0'+s).slice(-2);
            }
            tick();
            cdInt = setInterval(tick, 1000);
        }

        async function verify(){
            var pw = inputEl.value;
            if (!pw) return;

            submitBtn.disabled = true;
            var orig = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Verificando...</span>';

            var result = await tryUnlock(pw);

            submitBtn.disabled = false;
            submitBtn.innerHTML = orig;

            if (result) {
                clearAttempts();
                inputEl.value = '';
                initVault(result);
                screen.classList.add('hidden');
                showAccessGranted(function(){
                    showToast('Bienvenido · Vault desbloqueado','info',4000);
                });
            } else {
                inputEl.value = '';
                var n = incAttempts();
                var rem = MAX_ATTEMPTS - n;
                container.classList.add('shake');
                setTimeout(function(){ container.classList.remove('shake'); }, 500);
                if (rem <= 0) {
                    setLockout();
                    showLockUI(getLockoutUntil());
                } else {
                    errorText.textContent = 'Contraseña incorrecta. Intentos restantes: '+rem;
                    errorEl.classList.add('show');
                    setTimeout(function(){ errorEl.classList.remove('show'); }, 3500);
                    inputEl.focus();
                }
            }
        }

        submitBtn.addEventListener('click', verify);
        inputEl.addEventListener('keydown', function(e){
            if (e.key==='Enter') verify();
            errorEl.classList.remove('show');
        });
        togglePw.addEventListener('click', function(){
            var isP = inputEl.type==='password';
            inputEl.type = isP?'text':'password';
            togglePw.querySelector('i').className = isP?'fas fa-eye-slash':'fas fa-eye';
        });

        // Verificar bloqueo al cargar
        if (isLocked()) showLockUI(getLockoutUntil());
        else setTimeout(function(){ inputEl.focus(); }, 350);
    })();

    /* ──────────────────────────────────────────
       LIMPIEZA
    ────────────────────────────────────────── */
    window.addEventListener('beforeunload', function(){
        if (hideTimer)   clearTimeout(hideTimer);
        if (barInterval) clearInterval(barInterval);
    });

});
