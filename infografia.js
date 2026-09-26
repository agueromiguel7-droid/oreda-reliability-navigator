/**
 * OREDA INFOGRAPHIC & DIDACTIC COMPANION APP LOGIC
 * Powered by OREDA Database & ISO 14224
 * Grupo Reliarisk
 */

(function () {
  'use strict';

  const el = {
    searchInput: document.getElementById('infoSearchInput'),
    tableBody: document.getElementById('infoSearchTableBody')
  };

  // Comprehensive Catalog of all Equipment Classes across OREDA
  const CATALOG = [
    // 1. Machinery
    {
      family: 'Maquinaria (Machinery)',
      family_en: 'Machinery',
      class_name: 'Compresores (Compressors)',
      taxonomy: '1.1',
      subdivisions: 'Centrífugos (Motor Eléctrico, Turbina Gas), Reciprocantes (Pistón), Tornillo Rotativo (Screw)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Maquinaria (Machinery)',
      family_en: 'Machinery',
      class_name: 'Turbinas de Gas (Gas Turbines)',
      taxonomy: '1.2',
      subdivisions: 'Aeroderivadas (<10 MW, 10-50 MW), Industriales Pesadas (<10 MW, 10-50 MW, >50 MW)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Maquinaria (Machinery)',
      family_en: 'Machinery',
      class_name: 'Bombas (Pumps)',
      taxonomy: '1.3',
      subdivisions: 'Centrífugas en 14 servicios (Crudo, Inyección Agua, Contra Incendio, etc.), Reciprocantes, Rotativas',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Maquinaria (Machinery)',
      family_en: 'Machinery',
      class_name: 'Motores de Combustión (Combustion Engines)',
      taxonomy: '1.4',
      subdivisions: 'Motores Diesel (Generador Emergencia, Bomba Contra Incendio), Motores a Gas',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Maquinaria (Machinery)',
      family_en: 'Machinery',
      class_name: 'Turboexpansores (Turboexpanders)',
      taxonomy: '1.5',
      subdivisions: 'Expansores de Gas de Proceso Criogénico, Unidades Recompresoras',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Maquinaria (Machinery)',
      family_en: 'Machinery',
      class_name: 'Turbinas de Vapor (Steam Turbines)',
      taxonomy: '1.6',
      subdivisions: 'Accionamiento de Generadores Eléctricos, Accionamiento de Bombas de Caldera',
      editions: ['2002', '2009', '2015']
    },

    // 2. Electric Equipment
    {
      family: 'Equipo Eléctrico (Electric Equipment)',
      family_en: 'Electric Equipment',
      class_name: 'Generadores Eléctricos (Electric Generators)',
      taxonomy: '2.1',
      subdivisions: 'Accionados por Motor (Emergencia, Principal, Contra Incendio <1000 kVA, 1000-3000 kVA), Accionados por Turbina (Esencial, Principal <1000 kVA, 3-10 MVA, 20-30 MVA)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Eléctrico (Electric Equipment)',
      family_en: 'Electric Equipment',
      class_name: 'Motores Eléctricos (Electric Motors)',
      taxonomy: '2.2',
      subdivisions: 'Accionamiento de Compresores (5 servicios de gas y enfriamiento), Accionamiento de Bombas (15 servicios de proceso, agua, crudo y seguridad)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Eléctrico (Electric Equipment)',
      family_en: 'Electric Equipment',
      class_name: 'Baterías y Sistemas UPS (Battery & UPS)',
      taxonomy: '2.3',
      subdivisions: 'Bancos de Baterías Plomo-Ácido y Níquel-Cadmio, Inversores Estáticos UPS, Rectificadores/Cargadores',
      editions: ['2002', '2009', '2015']
    },

    // 3. Mechanical Equipment
    {
      family: 'Equipo Mecánico (Mechanical Equipment)',
      family_en: 'Mechanical Equipment',
      class_name: 'Recipientes de Proceso (Vessels)',
      taxonomy: '3.2',
      subdivisions: '10 Tipos (Coalescedores, Contactores, Columnas, Flash drums, Hidrociclones, Tamices, Scrubbers, Separadores, Tanques, Otros) subdivididos por volumen (<10 m³, 10-1000 m³, >1000 m³)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Mecánico (Mechanical Equipment)',
      family_en: 'Mechanical Equipment',
      class_name: 'Intercambiadores de Calor (Heat Exchangers)',
      taxonomy: '3.1',
      subdivisions: 'Placas y Empaques, Aletas Aéreas (Plate fin), Circuito Impreso (PCHE), Carcasa y Tubos (Shell & Tube)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Mecánico (Mechanical Equipment)',
      family_en: 'Mechanical Equipment',
      class_name: 'Calentadores y Calderas (Heaters & Boilers)',
      taxonomy: '3.3',
      subdivisions: 'Calentadores Fuego Directo, Calderas Eléctricas, Calderas Combustible HC, Recuperación de Calor (WHRU)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Mecánico (Mechanical Equipment)',
      family_en: 'Mechanical Equipment',
      class_name: 'Trampas de Diablos & Tuberías (Pig Traps & Piping)',
      taxonomy: '3.4 - 3.5',
      subdivisions: 'Lanzadores y Receptores de Diablos (Raspadores), Tramos de Tubería de Proceso, Juntas Bridadas',
      editions: ['2002', '2009', '2015']
    },

    // 4. Control and Safety Equipment
    {
      family: 'Instrumentación, Control y Seguridad',
      family_en: 'Control and Safety Equipment',
      class_name: 'Válvulas de Seguridad y Proceso (Valves)',
      taxonomy: '4.4',
      subdivisions: 'Paro de Emergencia (ESDV) 1" a 30" (Bola, Mariposa, Compuerta), Despresurización (BDV), Diluvio, Alivio y Seguridad (PSV), Retención (Check), Control de Proceso, Choke',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Instrumentación, Control y Seguridad',
      family_en: 'Control and Safety Equipment',
      class_name: 'Detectores de Fuego y Gas (F&G Detectors)',
      taxonomy: '4.1',
      subdivisions: 'Llama Infrarroja (IR3), Gas Tóxico H2S, Gas Combustible HC Infrarrojo, Humo Óptico, Sensores Térmicos',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Instrumentación, Control y Seguridad',
      family_en: 'Control and Safety Equipment',
      class_name: 'Sensores de Proceso (Process Sensors)',
      taxonomy: '4.2',
      subdivisions: 'Transmisores de Presión (Piezoresistivos/Capacitivos), Nivel (Radar/Desplazamiento), Flujo (Ultrasónico/DP), Temperatura (RTD PT100)',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Instrumentación, Control y Seguridad',
      family_en: 'Control and Safety Equipment',
      class_name: 'Unidades Lógicas de Control (Logic Units)',
      taxonomy: '4.3',
      subdivisions: 'Controladores Lógicos ESD (Arquitectura TMR 2oo3), Paneles F&G Redundantes, Controladores DCS',
      editions: ['2002', '2009', '2015']
    },

    // 5. Subsea Equipment (Vol 2)
    {
      family: 'Equipo Submarino (Subsea Equipment)',
      family_en: 'Subsea Equipment',
      class_name: 'Sistemas de Control Submarino (Subsea SCM)',
      taxonomy: '5.1',
      subdivisions: 'Módulos de Control Submarino (SCM) para Árboles, Múltiples de Producción y Válvulas SSIV',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Submarino (Subsea Equipment)',
      family_en: 'Subsea Equipment',
      class_name: 'Líneas de Flujo y Ductos (Flowlines & Pipelines)',
      taxonomy: '5.2',
      subdivisions: 'Líneas Submarinas de Exportación, Inyección de Agua/Gas, Ductos Intercampo y Líneas de Producción',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Submarino (Subsea Equipment)',
      family_en: 'Subsea Equipment',
      class_name: 'Múltiples Submarinos (Subsea Manifolds)',
      taxonomy: '5.3',
      subdivisions: 'Múltiples de Recolección de Producción (4 a 8 slots), Múltiples de Inyección de Agua',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Submarino (Subsea Equipment)',
      family_en: 'Subsea Equipment',
      class_name: 'Cabezales y Árboles Submarinos (Subsea Trees)',
      taxonomy: '5.4',
      subdivisions: 'Árboles Submarinos Horizontales (10,000 psi), Árboles Verticales (15,000 psi), Wellhead Housings',
      editions: ['2002', '2009', '2015']
    },
    {
      family: 'Equipo Submarino (Subsea Equipment)',
      family_en: 'Subsea Equipment',
      class_name: 'Bombas Submarinas y BOP (Subsea Boosters & BOP)',
      taxonomy: '5.5 - 5.6',
      subdivisions: 'Bombas Multifásicas Submarinas (Boosters), Bombas ESP, Conjuntos BOP Submarinos (15,000 psi) y LMRP',
      editions: ['2002', '2009', '2015']
    }
  ];

  function renderTable(filter = '') {
    const q = filter.trim().toLowerCase();
    const filtered = CATALOG.filter(item => {
      if (!q) return true;
      const haystack = `${item.family} ${item.class_name} ${item.taxonomy} ${item.subdivisions}`.toLowerCase();
      return haystack.includes(q);
    });

    if (filtered.length === 0) {
      el.tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #73777f;">No se encontraron resultados para la búsqueda.</td></tr>';
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const editionBadges = item.editions.map(ed => `<span style="display: inline-block; padding: 0.15rem 0.45rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; background: #e0f2fe; color: #0284c7; margin-right: 0.3rem;">${ed}</span>`).join('');

      html += `
        <tr>
          <td><strong>${escapeHtml(item.family)}</strong></td>
          <td><span style="color: #012743; font-weight: 600;">${escapeHtml(item.class_name)}</span></td>
          <td><span style="font-family: 'Space Grotesk', monospace; font-weight: 700; color: #0284c7;">${escapeHtml(item.taxonomy)}</span></td>
          <td><span style="font-size: 0.8rem; color: #43474e;">${escapeHtml(item.subdivisions)}</span></td>
          <td>${editionBadges}</td>
        </tr>
      `;
    });

    el.tableBody.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    renderTable();

    if (el.searchInput) {
      el.searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value);
      });
    }
  });

})();
