"""
=============================================================================
OREDA RELIABILITY NAVIGATOR - SECURE STREAMLIT CLOUD DEPLOYMENT
Grupo Reliarisk Software & Consulting
Integrated Access Control, Authentication, and Multi-Module Suite
=============================================================================
"""

import streamlit as st
import streamlit.components.v1 as components
import base64
import os
import hashlib
import time

# Set Page Config
st.set_page_config(
    page_title="OREDA Reliability Navigator | Grupo Reliarisk",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# 1. SECURITY & AUTHENTICATION CONFIGURATION
# -----------------------------------------------------------------------------
# Salt for secure hashing
SALT = "OREDA_RELIARISK_SECURE_2026_SALT"

def hash_pw(password: str) -> str:
    return hashlib.sha256((password + SALT).encode('utf-8')).hexdigest()

# Authorized Users Database (Username -> User Profile)
# Pre-configured secure hashes for default authorized accounts
DEFAULT_USERS = {
    "admin": {
        "name": "Ing. Administrador",
        "email": "admin@reliarisk.com",
        "role": "Administrador General (Full Access)",
        "password_hash": hash_pw("reliarisk2026")
    },
    "analista_ram": {
        "name": "Ingeniero Especialista RAM",
        "email": "analista@reliarisk.com",
        "role": "Ingeniero de Confiabilidad",
        "password_hash": hash_pw("oreda2026")
    },
    "cliente_demo": {
        "name": "Usuario Evaluador / Cliente",
        "email": "cliente@empresa.com",
        "role": "Visor Autorizado",
        "password_hash": hash_pw("demo2026")
    }
}

# Initialize session state for user database and login status
if "users_db" not in st.session_state:
    st.session_state.users_db = DEFAULT_USERS

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
    st.session_state.current_user = None

# -----------------------------------------------------------------------------
# 2. ASSET HELPERS & INLINING (CACHE FOR FAST RENDERING)
# -----------------------------------------------------------------------------
@st.cache_data
def get_base64_logo():
    if os.path.exists("mi_logo.png"):
        with open("mi_logo.png", "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    return ""

@st.cache_data
def load_bundle_html(app_type="main"):
    """
    Constructs a 100% self-contained HTML payload by inlining CSS, JS, data, and base64 logo.
    Works seamlessly on local machines and Streamlit Cloud with zero CORS/path errors.
    """
    logo_b64 = get_base64_logo()
    
    if app_type == "main":
        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()
        with open("app.css", "r", encoding="utf-8") as f:
            css = f.read()
        with open("oreda_data.js", "r", encoding="utf-8") as f:
            data_js = f.read()
        with open("app.js", "r", encoding="utf-8") as f:
            app_js = f.read()

        # Replace external references with inlined code
        html = html.replace('<link rel="stylesheet" href="app.css">', f'<style>{css}</style>')
        html = html.replace('src="mi_logo.png"', f'src="{logo_b64}"')
        html = html.replace('<script src="oreda_data.js"></script>', f'<script>{data_js}</script>')
        html = html.replace('<script src="app.js"></script>', f'<script>{app_js}</script>')
        return html

    elif app_type == "infografia":
        with open("infografia.html", "r", encoding="utf-8") as f:
            html = f.read()
        with open("infografia.css", "r", encoding="utf-8") as f:
            css = f.read()
        with open("oreda_data.js", "r", encoding="utf-8") as f:
            data_js = f.read()
        with open("infografia.js", "r", encoding="utf-8") as f:
            info_js = f.read()

        html = html.replace('<link rel="stylesheet" href="infografia.css">', f'<style>{css}</style>')
        html = html.replace('src="mi_logo.png"', f'src="{logo_b64}"')
        html = html.replace('<script src="oreda_data.js"></script>', f'<script>{data_js}</script>')
        html = html.replace('<script src="infografia.js"></script>', f'<script>{info_js}</script>')
        return html

    elif app_type == "manual":
        with open("manual_usuario.html", "r", encoding="utf-8") as f:
            html = f.read()
        html = html.replace('src="mi_logo.png"', f'src="{logo_b64}"')
        return html

    return "<h2>Módulo no disponible.</h2>"


# -----------------------------------------------------------------------------
# 3. LOGIN SCREEN (SECURE AUTHENTICATION GATEWAY)
# -----------------------------------------------------------------------------
def render_login_screen():
    logo_b64 = get_base64_logo()
    
    # Custom CSS for Login Page
    st.markdown("""
    <style>
    .login-container-card {
        background: #ffffff;
        border-radius: 1rem;
        padding: 2.5rem 3rem;
        box-shadow: 0 16px 48px rgba(1, 39, 67, 0.08);
        border: 1px solid rgba(195, 199, 206, 0.25);
        max-width: 520px;
        margin: 2rem auto;
        text-align: center;
    }
    .login-logo {
        height: 60px;
        margin-bottom: 1.25rem;
        object-fit: contain;
    }
    .login-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.6rem;
        font-weight: 700;
        color: #012743;
        margin-bottom: 0.35rem;
    }
    .login-subtitle {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 1.75rem;
    }
    .login-pill {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        color: #0284c7;
        background: #e0f2fe;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        text-transform: uppercase;
        margin-bottom: 1rem;
        letter-spacing: 0.06em;
    }
    .demo-creds-box {
        background: #f8fafc;
        border-radius: 0.65rem;
        padding: 1rem;
        margin-top: 1.5rem;
        font-size: 0.78rem;
        color: #475569;
        text-align: left;
        border-left: 3px solid #00F0FF;
    }
    </style>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(f"""
        <div class="login-container-card">
            <img src="{logo_b64}" class="login-logo">
            <div><span class="login-pill">Acceso Seguro • Grupo Reliarisk</span></div>
            <div class="login-title">OREDA Reliability Navigator</div>
            <div class="login-subtitle">Control de Acceso a Base de Datos y Suite RAM (ISO 14224)</div>
        </div>
        """, unsafe_allow_html=True)

        with st.form("login_form"):
            username = st.text_input("Usuario:", placeholder="Ej. admin o analista_ram")
            password = st.text_input("Contraseña:", type="password", placeholder="••••••••")
            submit = st.form_submit_button("Iniciar Sesión Segura ⚡", use_container_width=True)

            if submit:
                clean_user = username.strip().lower()
                if clean_user in st.session_state.users_db:
                    user_data = st.session_state.users_db[clean_user]
                    if user_data["password_hash"] == hash_pw(password.strip()):
                        st.session_state.authenticated = True
                        st.session_state.current_user = {
                            "username": clean_user,
                            "name": user_data["name"],
                            "email": user_data["email"],
                            "role": user_data["role"]
                        }
                        st.success(f"Bienvenido, {user_data['name']}!")
                        time.sleep(0.5)
                        st.rerun()
                    else:
                        st.error("Contraseña incorrecta. Verifique sus credenciales.")
                else:
                    st.error("Usuario no registrado o sin autorización de acceso.")

        # Demo Credentials Box
        st.markdown("""
        <div class="demo-creds-box">
            <strong>Credenciales de Demostración Configuradas:</strong><br>
            • <code>admin</code> / <code>reliarisk2026</code> (Administrador General)<br>
            • <code>analista_ram</code> / <code>oreda2026</code> (Especialista RAM)<br>
            • <code>cliente_demo</code> / <code>demo2026</code> (Visor Autorizado)
        </div>
        """, unsafe_allow_html=True)


# -----------------------------------------------------------------------------
# 4. AUTHENTICATED WORKSPACE (MAIN SUITE)
# -----------------------------------------------------------------------------
def render_authenticated_workspace():
    current = st.session_state.current_user
    logo_b64 = get_base64_logo()

    # --- SIDEBAR CONTROL PANEL ---
    with st.sidebar:
        st.markdown(f"""
        <div style="text-align: center; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <img src="{logo_b64}" style="height: 48px; filter: brightness(0) invert(1);">
            <div style="font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #00F0FF; font-size: 1.1rem; margin-top: 0.5rem;">
                OREDA Navigator Suite
            </div>
            <div style="font-size: 0.72rem; color: #94a3b8;">ISO 14224 Reliability Modeling</div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(f"""
        <div style="background: rgba(255,255,255,0.06); padding: 0.85rem; border-radius: 0.5rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Usuario Activo:</div>
            <div style="font-weight: 700; color: #ffffff; font-size: 0.95rem;">{current['name']}</div>
            <div style="font-size: 0.76rem; color: #00F0FF; font-weight: 600;">{current['role']}</div>
        </div>
        """, unsafe_allow_html=True)

        # Navigation Selector
        nav_options = [
            "📊 Navegador OREDA (Aplicación Principal)",
            "📘 Guía Didáctica e Infografía",
            "📖 Manual de Usuario Oficial"
        ]
        
        # Add Admin Tab if user is admin
        if "admin" in current["username"].lower() or "administrador" in current["role"].lower():
            nav_options.append("👥 Control de Accesos & Usuarios")

        selected_module = st.radio(
            "Seleccione Módulo de Trabajo:",
            nav_options,
            index=0
        )

        st.markdown("---")
        
        # Logout Button
        if st.button("🚪 Cerrar Sesión Segura", use_container_width=True):
            st.session_state.authenticated = False
            st.session_state.current_user = None
            st.rerun()

        st.markdown("""
        <div style="font-size: 0.7rem; color: #64748b; text-align: center; margin-top: 2rem;">
            © 2026 Grupo Reliarisk Software<br>Todos los derechos reservados.
        </div>
        """, unsafe_allow_html=True)

    # --- MAIN VIEWPORT RENDERING ---
    if selected_module == "📊 Navegador OREDA (Aplicación Principal)":
        html_code = load_bundle_html("main")
        components.html(html_code, height=1350, scrolling=True)

    elif selected_module == "📘 Guía Didáctica e Infografía":
        html_code = load_bundle_html("infografia")
        components.html(html_code, height=1350, scrolling=True)

    elif selected_module == "📖 Manual de Usuario Oficial":
        html_code = load_bundle_html("manual")
        components.html(html_code, height=1350, scrolling=True)

    elif selected_module == "👥 Control de Accesos & Usuarios":
        st.markdown("## 👥 Panel de Control de Accesos y Gestión de Usuarios")
        st.markdown("Como **Administrador de Grupo Reliarisk**, puedes autorizar o revocar accesos a la plataforma en tiempo real.")

        # Users Table
        users_list = []
        for uname, udata in st.session_state.users_db.items():
            users_list.append({
                "Usuario": uname,
                "Nombre Completo": udata["name"],
                "Correo Electrónico": udata["email"],
                "Rol / Perfil": udata["role"]
            })
        st.dataframe(users_list, use_container_width=True)

        st.markdown("### ➕ Registrar Nuevo Usuario Autorizado")
        with st.form("add_user_form"):
            new_u = st.text_input("Nombre de Usuario (Login):", placeholder="ej. j_perez")
            new_name = st.text_input("Nombre y Apellido:", placeholder="ej. Ing. Juan Pérez")
            new_email = st.text_input("Correo Corporativo:", placeholder="ej. jperez@empresa.com")
            new_role = st.selectbox("Rol Asignado:", ["Ingeniero de Confiabilidad", "Especialista RAM", "Visor Autorizado", "Administrador"])
            new_pass = st.text_input("Contraseña Temporal:", type="password", placeholder="••••••••")
            btn_add = st.form_submit_button("Crear Acceso Autorizado 🛡️")

            if btn_add:
                nu = new_u.strip().lower()
                if not nu or not new_pass:
                    st.error("Debe ingresar un usuario y una contraseña.")
                elif nu in st.session_state.users_db:
                    st.error(f"El usuario '{nu}' ya existe en el sistema.")
                else:
                    st.session_state.users_db[nu] = {
                        "name": new_name.strip() or nu,
                        "email": new_email.strip(),
                        "role": new_role,
                        "password_hash": hash_pw(new_pass.strip())
                    }
                    st.success(f"Usuario '{nu}' dado de alta exitosamente con rol '{new_role}'.")
                    time.sleep(0.5)
                    st.rerun()


# -----------------------------------------------------------------------------
# 5. ENTRYPOINT
# -----------------------------------------------------------------------------
def main():
    if not st.session_state.authenticated:
        render_login_screen()
    else:
        render_authenticated_workspace()

if __name__ == "__main__":
    main()
