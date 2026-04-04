import { useEffect, useState } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import Ticket from './components/Ticket';
import LoadingSpinner from './components/LoadingSpinner';
import PantallaLogin from './PantallaLogin';
import PantallaDashboard from './PantallaDashboard';
import PantallaPOS from './PantallaPOS';
import PantallaHistorial from './PantallaHistorial';
import PantallaCierre from './PantallaCierre';
import PantallaInventario from './PantallaInventario';
import PantallaConfiguracion from './PantallaConfiguracion';
import PantallaGastos from './PantallaGastos';
import PantallaClientes from './PantallaClientes';
import PantallaProveedores from './PantallaProveedores';
import PantallaUsuarios from './PantallaUsuarios';


function App() {
  const [isPosMode] = useState(() => {
    // Detectar si estamos en Electron (Modo POS)
    return window.navigator.userAgent.toLowerCase().includes('electron');
  });
  const [mostrarLogout, setMostrarLogout] = useState(false);
  const { notify } = useNotifications();
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kiosco_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [pantallaActual, setPantallaActual] = useState(() => {
    if (isPosMode) return 'POS';
    return localStorage.getItem('kiosco_screen') || 'Panel';
  });
  const [filtrosInventario, setFiltrosInventario] = useState({ soloBajoStock: false });

  useEffect(() => {
    if (user) {
      localStorage.setItem('kiosco_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kiosco_user');
      localStorage.removeItem('kiosco_screen');
    }
  }, [user]);

  // Forzar sidebar cerrado en POS si es necesario, pero ahora el sidebar será dinámico
  useEffect(() => {
    if (isPosMode && pantallaActual === 'POS') {
      setSidebarOpen(false);
    } else if (window.innerWidth > 1024) {
      setSidebarOpen(true);
    }
  }, [pantallaActual, isPosMode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('kiosco_screen', pantallaActual);
      
      // Redirigir admin si está en POS (puede entrar si quiere, o lo dejamos en Panel)
      if (user.rol === 'admin' && pantallaActual === 'POS') {
        // Opcional: setPantallaActual('Panel');
      }
    }
  }, [pantallaActual, user]);
  const [config, setConfig] = useState({
    nombreNegocio: "",
    direccion: "",
    telefono: "",
    mensajePie: ""
  });

  const cargarConfig = () => {
    api.get('/api/config')
      .then(setConfig)
      .catch(err => {
        console.error("Error cargando config", err);
        notify('Error cargando configuración', 'error');
      });
  };

  useEffect(() => {
    cargarConfig();
  }, []);

  useEffect(() => {
    const manejarTeclas = (e) => {
      if (!user) return;

      // Mantener Enter para procesar venta si estamos en esa pantalla
      if (e.key === 'Enter' && pantallaActual === 'POS') {
        const event = new CustomEvent('procesar-venta');
        window.dispatchEvent(event);
      }
    };
    window.addEventListener('keydown', manejarTeclas);
    return () => window.removeEventListener('keydown', manejarTeclas);
  }, [user, pantallaActual]);

  const [ventaGlobalPrint, setVentaGlobalPrint] = useState(null);

  const alImprimirFisico = (venta) => {
    setVentaGlobalPrint(venta);
    setTimeout(() => {
      window.print();
      setVentaGlobalPrint(null);
    }, 1000);
  };

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  // Cerrar sidebar al cambiar de pantalla en móviles
  const navegar = (pantalla, filtros = null) => {
    setPantallaActual(pantalla);
    setFiltrosInventario(filtros || { soloBajoStock: false });
    
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <PantallaLogin alIngresar={setUser} config={config} />;
  }

  return (
    <>
      <div className={`app-shell ${!sidebarOpen ? 'sidebar-closed' : ''} no-print`}>
        <button
          className="sidebar-toggle no-print"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>

        <aside className="sidebar no-print">
          <div className="sidebar-header" style={{ height: '100px', padding: '0 0.5rem 0 2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }} />
            ) : (
              <img src="/logo_horizontal_pillar.png" alt="Logo PILLAR" style={{ width: '100%', maxWidth: '110%', height: 'auto', maxHeight: '200px', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }} />
            )}
          </div>

          <div className="sidebar-menu">
            {isPosMode ? (
              // MENU MODO POS (.EXE)
              <>
                <button
                  onClick={() => navegar('POS')}
                  className={`nav-link ${pantallaActual === 'POS' ? 'active' : ''}`}
                >
                  PUNTO DE VENTA
                </button>
                <button
                  onClick={() => navegar('Historial')}
                  className={`nav-link ${pantallaActual === 'Historial' ? 'active' : ''}`}
                >
                  HISTORIAL
                </button>
                <button
                  onClick={() => navegar('Caja')}
                  className={`nav-link ${pantallaActual === 'Caja' ? 'active' : ''}`}
                >
                  CIERRE DE CAJA
                </button>
              </>
            ) : (
              // MENU MODO ADMIN (WEB)
              <>
                <button
                  onClick={() => navegar('Panel')}
                  className={`nav-link ${pantallaActual === 'Panel' ? 'active' : ''}`}
                >
                  PANEL
                </button>
                <button
                  onClick={() => navegar('Inventario')}
                  className={`nav-link ${pantallaActual === 'Inventario' ? 'active' : ''}`}
                >
                  INVENTARIO
                </button>
                <button
                  onClick={() => navegar('Historial')}
                  className={`nav-link ${pantallaActual === 'Historial' ? 'active' : ''}`}
                >
                  HISTORIAL
                </button>
                <button
                  onClick={() => navegar('Caja')}
                  className={`nav-link ${pantallaActual === 'Caja' ? 'active' : ''}`}
                >
                  CAJA
                </button>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', margin: '15px 10px' }}></div>

                <button
                  onClick={() => navegar('Configuración')}
                  className={`nav-link ${pantallaActual === 'Configuración' ? 'active' : ''}`}
                >
                  CONFIGURACIÓN
                </button>
                <button
                  onClick={() => navegar('Gastos')}
                  className={`nav-link ${pantallaActual === 'Gastos' ? 'active' : ''}`}
                >
                  GASTOS
                </button>
                <button
                  onClick={() => navegar('Clientes')}
                  className={`nav-link ${pantallaActual === 'Clientes' ? 'active' : ''}`}
                >
                  CLIENTES
                </button>
                <button
                  onClick={() => navegar('Proveedores')}
                  className={`nav-link ${pantallaActual === 'Proveedores' ? 'active' : ''}`}
                >
                  PROVEEDORES
                </button>
                <button
                  onClick={() => navegar('Usuarios')}
                  className={`nav-link ${pantallaActual === 'Usuarios' ? 'active' : ''}`}
                >
                  USUARIOS
                </button>
              </>
            )}
          </div>
        </aside>

        <main className="app-shell-main" style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
          <header className="top-header no-print" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: sidebarOpen ? '0 1.5rem' : '0 1.5rem 0 4.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'padding 0.3s' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>
              {config.nombreNegocio}
            </h2>
            <div
              className="user-profile"
              onClick={() => { setUser(null); setPantallaActual('Ventas'); }}
              title="Cerrar sesión"
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem' }}>{user.nombre}</div>
                <div className="logout-btn">[CERRAR SESIÓN]</div>
              </div>
              <div style={{ fontSize: '1.5rem' }}>👤</div>
            </div>
          </header>

          <div className="app-container" style={{ flexGrow: 1, overflowY: 'auto' }}>
            {pantallaActual === 'Panel' && user.rol === 'admin' && <PantallaDashboard navegar={navegar} />}
            {pantallaActual === 'POS' && <PantallaPOS onPrint={alImprimirFisico} config={config} user={user} />}
            {pantallaActual === 'Historial' && <PantallaHistorial onPrint={alImprimirFisico} adminMode={user.rol === 'admin'} />}
            {pantallaActual === 'Caja' && <PantallaCierre user={user} />}

            {user.rol === 'admin' && (
              <>
                {pantallaActual === 'Inventario' && <PantallaInventario soloBajoStockInicial={filtrosInventario.soloBajoStock} />}
                {pantallaActual === 'Configuración' && <PantallaConfiguracion onConfigChange={cargarConfig} />}
                {pantallaActual === 'Gastos' && <PantallaGastos />}
                {pantallaActual === 'Clientes' && <PantallaClientes />}
                {pantallaActual === 'Proveedores' && <PantallaProveedores />}
                {pantallaActual === 'Usuarios' && <PantallaUsuarios />}
              </>
            )}
          </div>
        </main>
      </div>
      {ventaGlobalPrint && <Ticket venta={ventaGlobalPrint} config={config} />}
    </>
  );
}

export default App;