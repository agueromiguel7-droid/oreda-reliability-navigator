/**
 * OREDA RELIABILITY NAVIGATOR - CORE APPLICATION LOGIC
 * Adheres to DESIGN.md ("The Precision Architect")
 * Powered by ISO 14224 & OREDA Database
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    edition: '2009',
    selectedId: 'preset-user-sample', // Starts with the exact user report preset!
    timeBasisFilter: 'all',          // 'all', 'calendar', 'operational'
    selectedSeverities: ['all'],     // ['all'] or array of ['Critical', 'Degraded', 'Incipient', 'Unknown']
    activeTab: 'tab-report',
    searchQuery: '',
    simHours: 8760,
    simCostPerHour: 15000,
    simCustomMttr: null
  };

  // --- DOM ELEMENTS ---
  const el = {
    editionSelector: document.getElementById('editionSelector'),
    btnLoadUserPreset: document.getElementById('btnLoadUserPreset'),
    sidebarEditionBadge: document.getElementById('sidebarEditionBadge'),
    omniSearchInput: document.getElementById('omniSearchInput'),
    hierarchyAccordion: document.getElementById('hierarchyAccordion'),
    
    // Hero
    heroBreadcrumbs: document.getElementById('heroBreadcrumbs'),
    heroTaxCode: document.getElementById('heroTaxCode'),
    heroTitle: document.getElementById('heroTitle'),
    heroDesc: document.getElementById('heroDesc'),
    metaPop: document.getElementById('metaPop'),
    metaInst: document.getElementById('metaInst'),
    metaCal: document.getElementById('metaCal'),
    metaOp: document.getElementById('metaOp'),
    metaDem: document.getElementById('metaDem'),

    // Cascading Hierarchy Selectors (ISO 14224 Level 5 -> 6 -> 7 -> 8)
    selFamily: document.getElementById('selFamily'),
    selClass: document.getElementById('selClass'),
    selSubtype: document.getElementById('selSubtype'),
    selFactor: document.getElementById('selFactor'),

    // Tabs
    tabButtons: document.querySelectorAll('.view-tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    timeBasisFilter: document.getElementById('timeBasisFilter'),
    severityFilterGroup: document.getElementById('severityFilterGroup'),
    severityActiveSummary: document.getElementById('severityActiveSummary'),

    // Table
    oredaReportTable: document.getElementById('oredaReportTable'),
    oredaTableBody: document.getElementById('oredaTableBody'),

    // Actions
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnCopyTsv: document.getElementById('btnCopyTsv'),
    btnPrintReport: document.getElementById('btnPrintReport'),
    toastMsg: document.getElementById('toastMsg'),
    toastText: document.getElementById('toastText'),

    // RAM KPI
    kpiLambda: document.getElementById('kpiLambda'),
    kpiLambdaYear: document.getElementById('kpiLambdaYear'),
    kpiMtbf: document.getElementById('kpiMtbf'),
    kpiMtbfYear: document.getElementById('kpiMtbfYear'),
    kpiMttr: document.getElementById('kpiMttr'),
    kpiManhours: document.getElementById('kpiManhours'),
    kpiAvailability: document.getElementById('kpiAvailability'),
    kpiDowntime: document.getElementById('kpiDowntime'),

    // Chart Containers
    reliabilityChartBox: document.getElementById('reliabilityChartBox'),
    paretoChartBox: document.getElementById('paretoChartBox'),
    maintainabilityChartBox: document.getElementById('maintainabilityChartBox'),
    gammaChartBox: document.getElementById('gammaChartBox'),
    compareHistoryChartBox: document.getElementById('compareHistoryChartBox'),
    comparatorGrid: document.getElementById('comparatorGrid'),

    // Simulator
    simHours: document.getElementById('simHours'),
    simCostPerHour: document.getElementById('simCostPerHour'),
    simCustomMttr: document.getElementById('simCustomMttr'),
    simResultsGrid: document.getElementById('simResultsGrid')
  };

  // --- INITIALIZATION ---
  function init() {
    if (!window.OREDA_DATA || !window.OREDA_DATA.items) {
      console.error('OREDA database could not be loaded.');
      showToast('Error cargando la base de datos OREDA', 'error');
      return;
    }

    bindEvents();
    renderSidebarHierarchy();
    selectEquipment(state.selectedId);
    showToast('Base de datos OREDA e ISO 14224 cargada correctamente');
  }

  // --- EVENT BINDINGS ---
  function bindEvents() {
    // Edition Switcher
    el.editionSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.edition-btn');
      if (!btn) return;
      const ed = btn.dataset.edition;
      if (ed === state.edition) return;

      el.editionSelector.querySelectorAll('.edition-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.edition = ed;
      el.sidebarEditionBadge.textContent = `Edición ${ed}`;

      renderSidebarHierarchy();
      
      // Auto-select first available item for the new edition
      const available = getItemsForEdition(state.edition);
      if (available.length > 0) {
        selectEquipment(available[0].id);
      }
      showToast(`Cambiado a OREDA ${ed}`);
    });

    // Preset User Report Button
    el.btnLoadUserPreset.addEventListener('click', () => {
      // Switch edition to 2009 if needed
      state.edition = '2009';
      el.editionSelector.querySelectorAll('.edition-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.edition === '2009');
      });
      el.sidebarEditionBadge.textContent = 'Edición 2009';
      renderSidebarHierarchy();
      selectEquipment('preset-user-sample');
      
      // Ensure we are on the report tab
      switchTab('tab-report');
      showToast('Reporte muestra de la imagen cargado con éxito');
    });

    // Omnisearch
    el.omniSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderSidebarHierarchy();
    });

    // Tab Navigation
    el.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // Time Basis Filter Pills
    el.timeBasisFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill-btn');
      if (!btn) return;
      el.timeBasisFilter.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.timeBasisFilter = btn.dataset.basis;
      renderReportTable();
    });

    // Severity Multi-select Filter Pills (1. Critical, 2. Degraded, 3. Incipient, 4. Unknown)
    if (el.severityFilterGroup) {
      el.severityFilterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill-btn');
        if (!btn) return;
        const sev = btn.dataset.severity;

        if (sev === 'all') {
          // Reset to show all
          state.selectedSeverities = ['all'];
        } else {
          // If currently 'all', switch to only this selected severity
          if (state.selectedSeverities.includes('all')) {
            state.selectedSeverities = [sev];
          } else {
            // Toggle clicked severity
            if (state.selectedSeverities.includes(sev)) {
              state.selectedSeverities = state.selectedSeverities.filter(s => s !== sev);
            } else {
              state.selectedSeverities.push(sev);
            }
          }

          // If no severity selected or all 4 selected, reset to 'all'
          const allOptions = ['Critical', 'Degraded', 'Incipient', 'Unknown'];
          if (state.selectedSeverities.length === 0 || state.selectedSeverities.length === allOptions.length) {
            state.selectedSeverities = ['all'];
          }
        }

        updateSeverityFilterUi();
        renderReportTable();
      });
    }

    // Export & Action Buttons
    el.btnExportCsv.addEventListener('click', exportCsv);
    el.btnCopyTsv.addEventListener('click', copyTsv);
    el.btnPrintReport.addEventListener('click', () => window.print());

    // Simulator Inputs
    [el.simHours, el.simCostPerHour, el.simCustomMttr].forEach(input => {
      if (input) {
        input.addEventListener('input', updateSimulator);
      }
    });

    // Cascading Hierarchy Selectors (ISO 14224 Level 5 -> 6 -> 7 -> 8)
    if (el.selFamily) el.selFamily.addEventListener('change', onFamilySelectChange);
    if (el.selClass) el.selClass.addEventListener('change', onClassSelectChange);
    if (el.selSubtype) el.selSubtype.addEventListener('change', onSubtypeSelectChange);
    if (el.selFactor) el.selFactor.addEventListener('change', onFactorSelectChange);
  }

  // --- DATA ACCESS HELPERS ---
  function getItemsForEdition(ed) {
    return window.OREDA_DATA.items.filter(item => item.edition === ed || item.is_user_preset);
  }

  function getSelectedItem() {
    return window.OREDA_DATA.items.find(item => item.id === state.selectedId) || window.OREDA_DATA.items[0];
  }

  // --- SIDEBAR HIERARCHY RENDERING (ISO 14224 Level 5 -> 6 -> 7/8) ---
  function renderSidebarHierarchy() {
    const items = getItemsForEdition(state.edition);
    const query = state.searchQuery;

    // Filter items if search query exists
    const filteredItems = items.filter(item => {
      if (!query) return true;
      const haystack = [
        item.name,
        item.equipment_class,
        item.equipment_class_es,
        item.subtype,
        item.subtype_es,
        item.specific_factor,
        item.factor_value,
        item.taxonomy_no,
        item.service,
        ...(item.failure_modes || []).map(m => `${m.mode} ${m.mode_es} ${m.code}`)
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    // Group by Family -> Equipment Class
    const grouped = {};
    window.OREDA_DATA.metadata.families.forEach(f => {
      grouped[f.id] = {
        name_es: f.name_es,
        classes: {}
      };
    });

    filteredItems.forEach(item => {
      if (!grouped[item.family]) {
        grouped[item.family] = {
          name_es: item.family_es || item.family,
          classes: {}
        };
      }
      const cls = item.equipment_class || 'General';
      if (!grouped[item.family].classes[cls]) {
        grouped[item.family].classes[cls] = {
          name_es: item.equipment_class_es || cls,
          items: []
        };
      }
      grouped[item.family].classes[cls].items.push(item);
    });

    const familyIcons = {
      'Machinery': '⚙️',
      'Electric Equipment': '⚡',
      'Mechanical Equipment': '🔩',
      'Control and Safety Equipment': '🛡️',
      'Subsea Equipment': '🌊'
    };

    let html = '';
    for (const [famId, famData] of Object.entries(grouped)) {
      const classKeys = Object.keys(famData.classes);
      const totalItemsInFam = classKeys.reduce((acc, k) => acc + famData.classes[k].items.length, 0);
      if (totalItemsInFam === 0) continue;

      const icon = familyIcons[famId] || '📁';
      
      html += `
        <div class="family-block" data-family="${famId}">
          <div class="family-header">
            <div class="family-info">
              <span class="family-icon">${icon}</span>
              <span class="family-name">${famData.name_es}</span>
            </div>
            <span class="family-badge">${totalItemsInFam}</span>
          </div>
          <div class="family-items-list">
            ${classKeys.map(clsKey => {
              const clsData = famData.classes[clsKey];
              // Check if currently selected item is in this class
              const hasActiveItem = clsData.items.some(it => it.id === state.selectedId);
              return `
                <div class="class-nested-block ${hasActiveItem ? '' : 'collapsed'}" data-class="${clsKey}">
                  <div class="class-nested-header">
                    <div class="class-nested-title">
                      <span class="class-caret">▾</span>
                      <span>${clsData.name_es}</span>
                    </div>
                    <span class="class-nested-badge">${clsData.items.length}</span>
                  </div>
                  <div class="class-nested-list">
                    ${clsData.items.map(item => `
                      <button class="nav-item-btn ${item.id === state.selectedId ? 'active' : ''}" data-id="${item.id}" title="${escapeHtml(item.name)}">
                        <span class="nav-item-text">
                          <span class="nav-item-main">${escapeHtml(item.subtype_es || item.subtype || item.name)}</span>
                          ${item.specific_factor ? `<span class="nav-item-subtext">${escapeHtml(item.specific_factor)}</span>` : ''}
                        </span>
                        <span class="taxonomy-tag">${item.taxonomy_no}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (!html) {
      html = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No se encontraron equipos para "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
    }

    el.hierarchyAccordion.innerHTML = html;

    // Attach click events on equipment class headers (accordion collapse/expand)
    el.hierarchyAccordion.querySelectorAll('.class-nested-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const block = header.closest('.class-nested-block');
        if (block) {
          block.classList.toggle('collapsed');
        }
      });
    });

    // Attach click events on navigation buttons
    el.hierarchyAccordion.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectEquipment(btn.dataset.id);
      });
    });
  }

  // --- SELECT EQUIPMENT ---
  function selectEquipment(itemId, syncDropdowns = true) {
    state.selectedId = itemId;
    const item = getSelectedItem();
    if (!item) return;

    // Update active class in sidebar
    el.hierarchyAccordion.querySelectorAll('.nav-item-btn').forEach(btn => {
      const isActive = btn.dataset.id === itemId;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        // Ensure parent class block is uncollapsed
        const parentClassBlock = btn.closest('.class-nested-block');
        if (parentClassBlock) {
          parentClassBlock.classList.remove('collapsed');
        }
      }
    });

    // Update Hero Panel
    el.heroBreadcrumbs.innerHTML = `
      <span>${item.family_es || item.family}</span>
      <span class="sep">/</span>
      <span>${item.equipment_class_es || item.equipment_class}</span>
      <span class="sep">/</span>
      <span>${item.subtype_es || item.subtype}</span>
      <span class="sep">/</span>
      <span id="heroTaxCode">Tax. ${item.taxonomy_no}</span>
    `;

    el.heroTitle.textContent = item.name;
    el.heroDesc.textContent = item.description || `Datos de confiabilidad y falla según OREDA ${item.edition} y norma ISO 14224.`;

    // Populate Meta Grid
    el.metaPop.textContent = item.population != null ? item.population.toLocaleString() : 'N/A';
    el.metaInst.textContent = item.installations != null ? item.installations.toLocaleString() : 'N/A';
    el.metaCal.textContent = item.calendar_time_10e6 ? `${item.calendar_time_10e6.toFixed(4)} × 10⁶ h` : 'N/A';
    el.metaOp.textContent = item.operational_time_10e6 ? `${item.operational_time_10e6.toFixed(4)} × 10⁶ h` : 'N/A';
    el.metaDem.textContent = item.no_of_demands ? item.no_of_demands.toLocaleString() : '0';

    // Synchronize Cascading Hierarchy Dropdowns
    if (syncDropdowns) {
      syncCascadingDropdowns(item);
    }

    // Render Active Tab Content
    renderReportTable();
    renderRamDashboard();
    renderComparator();
    updateSimulator();
  }

  // --- CASCADING HIERARCHY SELECTORS (ISO 14224 Level 5 -> 6 -> 7 -> 8) ---
  function syncCascadingDropdowns(item) {
    if (!el.selFamily || !el.selClass || !el.selSubtype || !el.selFactor) return;

    const editionItems = getItemsForEdition(state.edition);

    // 1. Populate Family Select
    const distinctFamilies = [];
    const famMap = {};
    editionItems.forEach(it => {
      if (!famMap[it.family]) {
        famMap[it.family] = it.family_es || it.family;
        distinctFamilies.push({ id: it.family, name: it.family_es || it.family });
      }
    });

    el.selFamily.innerHTML = distinctFamilies.map(f => `
      <option value="${f.id}" ${f.id === item.family ? 'selected' : ''}>${escapeHtml(f.name)}</option>
    `).join('');

    // 2. Populate Class Select for this family
    populateClassOptions(item.family, item.equipment_class);

    // 3. Populate Subtype Select for this class
    populateSubtypeOptions(item.family, item.equipment_class, item.subtype);

    // 4. Populate Factor Select for this subtype
    populateFactorOptions(item.family, item.equipment_class, item.subtype, item.id);
  }

  function populateClassOptions(familyId, selectedClass) {
    const editionItems = getItemsForEdition(state.edition);
    const famItems = editionItems.filter(it => it.family === familyId);
    const classes = [];
    const clsMap = {};
    famItems.forEach(it => {
      const c = it.equipment_class;
      if (!clsMap[c]) {
        clsMap[c] = it.equipment_class_es || c;
        classes.push({ id: c, name: it.equipment_class_es || c });
      }
    });

    el.selClass.innerHTML = classes.map(c => `
      <option value="${c.id}" ${c.id === selectedClass ? 'selected' : ''}>${escapeHtml(c.name)}</option>
    `).join('');
  }

  function populateSubtypeOptions(familyId, classId, selectedSubtype) {
    const editionItems = getItemsForEdition(state.edition);
    const classItems = editionItems.filter(it => it.family === familyId && it.equipment_class === classId);
    const subtypes = [];
    const subMap = {};
    classItems.forEach(it => {
      const s = it.subtype || it.name;
      if (!subMap[s]) {
        subMap[s] = it.subtype_es || s;
        subtypes.push({ id: s, name: it.subtype_es || s });
      }
    });

    el.selSubtype.innerHTML = subtypes.map(s => `
      <option value="${s.id}" ${s.id === selectedSubtype ? 'selected' : ''}>${escapeHtml(s.name)}</option>
    `).join('');
  }

  function populateFactorOptions(familyId, classId, subtypeId, selectedItemId) {
    const editionItems = getItemsForEdition(state.edition);
    const subtypeItems = editionItems.filter(it => 
      it.family === familyId && 
      it.equipment_class === classId && 
      (it.subtype === subtypeId || it.name === subtypeId)
    );

    el.selFactor.innerHTML = subtypeItems.map(it => {
      const factorLabel = it.specific_factor || it.service || it.driver || 'Estándar / General';
      return `<option value="${it.id}" ${it.id === selectedItemId ? 'selected' : ''}>${escapeHtml(factorLabel)} (Tax. ${it.taxonomy_no})</option>`;
    }).join('');
  }

  // Cascading Select Handlers
  function onFamilySelectChange(e) {
    const familyId = e.target.value;
    const editionItems = getItemsForEdition(state.edition);
    const famItems = editionItems.filter(it => it.family === familyId);
    if (famItems.length === 0) return;

    const firstItem = famItems[0];
    populateClassOptions(familyId, firstItem.equipment_class);
    populateSubtypeOptions(familyId, firstItem.equipment_class, firstItem.subtype);
    populateFactorOptions(familyId, firstItem.equipment_class, firstItem.subtype, firstItem.id);
    selectEquipment(firstItem.id, false);
  }

  function onClassSelectChange(e) {
    const classId = e.target.value;
    const familyId = el.selFamily.value;
    const editionItems = getItemsForEdition(state.edition);
    const classItems = editionItems.filter(it => it.family === familyId && it.equipment_class === classId);
    if (classItems.length === 0) return;

    const firstItem = classItems[0];
    populateSubtypeOptions(familyId, classId, firstItem.subtype);
    populateFactorOptions(familyId, classId, firstItem.subtype, firstItem.id);
    selectEquipment(firstItem.id, false);
  }

  function onSubtypeSelectChange(e) {
    const subtypeId = e.target.value;
    const familyId = el.selFamily.value;
    const classId = el.selClass.value;
    const editionItems = getItemsForEdition(state.edition);
    const subtypeItems = editionItems.filter(it => 
      it.family === familyId && 
      it.equipment_class === classId && 
      (it.subtype === subtypeId || it.name === subtypeId)
    );
    if (subtypeItems.length === 0) return;

    const firstItem = subtypeItems[0];
    populateFactorOptions(familyId, classId, subtypeId, firstItem.id);
    selectEquipment(firstItem.id, false);
  }

  function onFactorSelectChange(e) {
    const itemId = e.target.value;
    selectEquipment(itemId, false);
  }

  // --- TAB SWITCHER ---
  function switchTab(tabId) {
    state.activeTab = tabId;
    el.tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    el.tabPanes.forEach(pane => {
      pane.style.display = pane.id === tabId ? 'block' : 'none';
    });

    if (tabId === 'tab-report') {
      renderReportTable();
    } else if (tabId === 'tab-ram') {
      renderRamDashboard();
    } else if (tabId === 'tab-compare') {
      renderComparator();
    } else if (tabId === 'tab-sim') {
      updateSimulator();
    }
  }

  // --- SEVERITY FILTER UI SYNC ---
  function updateSeverityFilterUi() {
    if (!el.severityFilterGroup) return;

    const btns = el.severityFilterGroup.querySelectorAll('.filter-pill-btn');
    const isAll = state.selectedSeverities.includes('all');

    btns.forEach(b => {
      const sev = b.dataset.severity;
      if (sev === 'all') {
        b.classList.toggle('active', isAll);
      } else {
        b.classList.toggle('active', !isAll && state.selectedSeverities.includes(sev));
      }
    });

    if (el.severityActiveSummary) {
      if (isAll) {
        el.severityActiveSummary.innerHTML = '<span class="summary-pill">Mostrando: <strong>Todos los niveles</strong> (1 a 4)</span>';
      } else {
        const sevLabels = {
          'Critical': '🔴 1. Críticos',
          'Degraded': '🟡 2. Degradados',
          'Incipient': '🔵 3. Incipientes',
          'Unknown': '⚪ 4. Desconocidos'
        };
        const textList = state.selectedSeverities.map(s => sevLabels[s] || s).join(' + ');
        el.severityActiveSummary.innerHTML = `<span class="summary-pill">Mostrando (${state.selectedSeverities.length}): <strong>${textList}</strong></span>`;
      }
    }
  }

  // --- SEVERITY CATEGORY DEFINITIONS ---
  const SEVERITY_CONFIG = [
    { key: 'Critical', label: '1. Modos de Falla Críticos (Critical)', icon: '🔴', cssClass: 'group-critical', desc: 'Cese inmediato de la función principal requerida' },
    { key: 'Degraded', label: '2. Modos de Falla Degradados (Degraded)', icon: '🟡', cssClass: 'group-degraded', desc: 'Pérdida o deterioro parcial del rendimiento operativo' },
    { key: 'Incipient', label: '3. Modos de Falla Incipientes (Incipient)', icon: '🔵', cssClass: 'group-incipient', desc: 'Defecto o condición incipiente sin paro inmediato' },
    { key: 'Unknown', label: '4. Modos de Falla Desconocidos / Otros (Unknown)', icon: '⚪', cssClass: 'group-unknown', desc: 'Severidad no clasificada o no registrada' }
  ];

  // --- RENDER OFFICIAL OREDA REPORT TABLE (EXACT MATCH TO USER'S IMAGE) ---
  function renderReportTable() {
    const item = getSelectedItem();
    if (!item || !item.failure_modes || item.failure_modes.length === 0) {
      el.oredaTableBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 2rem;">No hay registros disponibles.</td></tr>';
      return;
    }

    let allModesList = [...item.failure_modes];

    // Filter by Time Basis (Calendar * or Operational †)
    if (state.timeBasisFilter === 'calendar') {
      allModesList = allModesList.filter(m => m.time_basis === 'calendar');
    } else if (state.timeBasisFilter === 'operational') {
      allModesList = allModesList.filter(m => m.time_basis === 'operational');
    }

    const showAll = state.selectedSeverities.includes('all');
    let rowsHtml = '';
    let totalRenderedSections = 0;

    // Render Grouped Severity Sections
    SEVERITY_CONFIG.forEach(sec => {
      // Check if this severity should be displayed
      if (!showAll && !state.selectedSeverities.includes(sec.key)) {
        return;
      }

      const secModes = allModesList.filter(m => m.severity === sec.key);
      if (secModes.length === 0) {
        return; // Skip empty severity group for this equipment
      }

      totalRenderedSections++;
      
      // Calculate distinct failure modes (considering * and † pairs)
      const uniqueCodes = new Set(secModes.map(m => m.code || m.mode));
      const modeCountText = `${uniqueCodes.size} modo${uniqueCodes.size !== 1 ? 's' : ''} (${secModes.length} registros)`;

      // Group Header Row
      rowsHtml += `
        <tr class="severity-group-header ${sec.cssClass}">
          <td colspan="12">
            <div class="group-header-content">
              <div class="group-header-title-box">
                <span>${sec.icon}</span>
                <span>${escapeHtml(sec.label)}</span>
              </div>
              <span class="group-header-count">${modeCountText}</span>
            </div>
          </td>
        </tr>
      `;

      // Render Mode Rows in this Severity Group
      secModes.forEach(m => {
        const starDagger = m.no_failures.includes('*') 
          ? '<span class="time-basis-star">*</span>' 
          : (m.no_failures.includes('†') ? '<span class="time-basis-dagger">†</span>' : '');

        const noFailuresDisplay = m.no_failures.replace(/[*†]/g, '') + starDagger;

        rowsHtml += `
          <tr>
            <td class="col-mode">${escapeHtml(m.mode)}</td>
            <td class="col-code">${escapeHtml(m.code)}</td>
            <td class="col-num" style="font-weight: 700;">${noFailuresDisplay}</td>
            <td class="col-num">${formatNumber(m.rate_lower)}</td>
            <td class="col-num mean-col">${formatNumber(m.rate_mean)}</td>
            <td class="col-num">${formatNumber(m.rate_upper)}</td>
            <td class="col-num">${formatNumber(m.rate_sd)}</td>
            <td class="col-num">${formatNumber(m.rate_nt)}</td>
            <td class="col-num" style="background: rgba(1, 39, 67, 0.02);">${formatNumber(m.active_repair_mean)}</td>
            <td class="col-num">${formatNumber(m.repair_min)}</td>
            <td class="col-num mean-col">${formatNumber(m.repair_mean)}</td>
            <td class="col-num">${formatNumber(m.repair_max)}</td>
          </tr>
        `;
      });
    });

    // Render "All modes" Summary Row at the Bottom (when showing All levels)
    const allSummaryModes = allModesList.filter(m => (m.mode && m.mode.toLowerCase().includes('all mode')) || m.severity === 'All');
    if (showAll && allSummaryModes.length > 0) {
      allSummaryModes.forEach(m => {
        const starDagger = m.no_failures.includes('*') 
          ? '<span class="time-basis-star">*</span>' 
          : (m.no_failures.includes('†') ? '<span class="time-basis-dagger">†</span>' : '');

        const noFailuresDisplay = m.no_failures.replace(/[*†]/g, '') + starDagger;

        rowsHtml += `
          <tr class="row-all-modes">
            <td class="col-mode"><strong>${escapeHtml(m.mode)}</strong></td>
            <td class="col-code"><strong>${escapeHtml(m.code)}</strong></td>
            <td class="col-num" style="font-weight: 700;">${noFailuresDisplay}</td>
            <td class="col-num"><strong>${formatNumber(m.rate_lower)}</strong></td>
            <td class="col-num mean-col"><strong>${formatNumber(m.rate_mean)}</strong></td>
            <td class="col-num"><strong>${formatNumber(m.rate_upper)}</strong></td>
            <td class="col-num"><strong>${formatNumber(m.rate_sd)}</strong></td>
            <td class="col-num"><strong>${formatNumber(m.rate_nt)}</strong></td>
            <td class="col-num" style="background: rgba(1, 39, 67, 0.05);"><strong>${formatNumber(m.active_repair_mean)}</strong></td>
            <td class="col-num"><strong>${formatNumber(m.repair_min)}</strong></td>
            <td class="col-num mean-col"><strong>${formatNumber(m.repair_mean)}</strong></td>
            <td class="col-num"><strong>${formatNumber(m.repair_max)}</strong></td>
          </tr>
        `;
      });
    }

    if (totalRenderedSections === 0 && (!showAll || allSummaryModes.length === 0)) {
      rowsHtml = `
        <tr>
          <td colspan="12" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
            <div style="font-size: 1.05rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--primary);">
              No se registran fallas para los filtros seleccionados
            </div>
            <div style="font-size: 0.82rem;">
              Este equipo no presenta registros en los niveles de severidad seleccionados bajo la base temporal activa.
            </div>
          </td>
        </tr>
      `;
    }

    el.oredaTableBody.innerHTML = rowsHtml;
  }

  // --- RENDER RAM DASHBOARD & ADVANCED METRICS ---
  function renderRamDashboard() {
    const item = getSelectedItem();
    if (!item || !item.failure_modes) return;

    // Find All modes row or sum failure rates respecting the time basis filter
    let allModeRow = null;
    if (state.timeBasisFilter === 'operational') {
      allModeRow = item.failure_modes.find(m => (m.mode.toLowerCase().includes('all') || m.severity === 'All') && m.time_basis === 'operational');
    } else {
      allModeRow = item.failure_modes.find(m => (m.mode.toLowerCase().includes('all') || m.severity === 'All') && m.time_basis === 'calendar');
    }
    if (!allModeRow) {
      allModeRow = item.failure_modes.find(m => m.mode.toLowerCase().includes('all') || m.severity === 'All') || item.failure_modes[0];
    }

    const lambdaPer10e6 = allModeRow ? allModeRow.rate_mean : 100.0;
    const lambdaPerHour = lambdaPer10e6 / 1e6;
    const lambdaPerYear = lambdaPerHour * 8760;

    const mtbfHours = lambdaPerHour > 0 ? 1 / lambdaPerHour : 999999;
    const mtbfYears = mtbfHours / 8760;

    const mttrHours = allModeRow ? allModeRow.active_repair_mean : 12.0;
    const meanManhours = allModeRow ? allModeRow.repair_mean : 24.0;

    // Availability: Ai = MTBF / (MTBF + MTTR)
    const availability = mtbfHours / (mtbfHours + mttrHours);
    const unavailability = 1 - availability;
    const annualDowntimeHours = unavailability * 8760;

    // Set KPI Bento Cards
    el.kpiLambda.textContent = formatNumber(lambdaPer10e6);
    el.kpiLambdaYear.textContent = `${lambdaPerYear.toFixed(2)} fallas/año`;

    el.kpiMtbf.textContent = `${Math.round(mtbfHours).toLocaleString()} h`;
    el.kpiMtbfYear.textContent = `${mtbfYears.toFixed(2)} años`;

    el.kpiMttr.textContent = `${formatNumber(mttrHours)} h`;
    el.kpiManhours.textContent = `${formatNumber(meanManhours)} HH prom.`;

    el.kpiAvailability.textContent = `${(availability * 100).toFixed(4)}%`;
    el.kpiDowntime.textContent = `${annualDowntimeHours.toFixed(1)} h/año`;

    // Render Charts
    renderReliabilityChart(lambdaPerHour);
    renderParetoChart(item.failure_modes);
    renderMaintainabilityChart(mttrHours);
    renderGammaUncertaintyChart(item.failure_modes);
  }

  // --- CHART 1: RELIABILITY R(t) & UNRELIABILITY F(t) (SVG) ---
  function renderReliabilityChart(lambda) {
    const width = 500;
    const height = 260;
    const padding = { top: 20, right: 30, bottom: 40, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxT = 8760; // 1 year
    const pointsR = [];
    const pointsF = [];

    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxT;
      const r = Math.exp(-lambda * t);
      const f = 1 - r;

      const x = padding.left + (t / maxT) * plotW;
      const yR = padding.top + (1 - r) * plotH;
      const yF = padding.top + (1 - f) * plotH;

      pointsR.push(`${x.toFixed(1)},${yR.toFixed(1)}`);
      pointsF.push(`${x.toFixed(1)},${yF.toFixed(1)}`);
    }

    const pathR = `M ${pointsR.join(' L ')}`;
    const pathF = `M ${pointsF.join(' L ')}`;

    // Area fill for R(t)
    const areaR = `M ${padding.left},${padding.top + plotH} L ${pointsR.join(' L ')} L ${padding.left + plotW},${padding.top + plotH} Z`;

    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left + plotW}" y2="${padding.top}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + plotH * 0.25}" x2="${padding.left + plotW}" y2="${padding.top + plotH * 0.25}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + plotH * 0.5}" x2="${padding.left + plotW}" y2="${padding.top + plotH * 0.5}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + plotH * 0.75}" x2="${padding.left + plotW}" y2="${padding.top + plotH * 0.75}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>

        <!-- Y Axis Ticks -->
        <text x="${padding.left - 10}" y="${padding.top + 4}" font-size="10" fill="#64748b" text-anchor="end">1.0</text>
        <text x="${padding.left - 10}" y="${padding.top + plotH * 0.5 + 4}" font-size="10" fill="#64748b" text-anchor="end">0.5</text>
        <text x="${padding.left - 10}" y="${padding.top + plotH + 4}" font-size="10" fill="#64748b" text-anchor="end">0.0</text>

        <!-- X Axis Ticks -->
        <text x="${padding.left}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">0 h</text>
        <text x="${padding.left + plotW * 0.25}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">2,190 h</text>
        <text x="${padding.left + plotW * 0.5}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">4,380 h</text>
        <text x="${padding.left + plotW * 0.75}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">6,570 h</text>
        <text x="${padding.left + plotW}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">8,760 h (1 año)</text>

        <!-- Area & Paths -->
        <path d="${areaR}" fill="url(#gradR)"/>
        <path d="${pathR}" fill="none" stroke="#0284c7" stroke-width="2.5"/>
        <path d="${pathF}" fill="none" stroke="#e11d48" stroke-width="2" stroke-dasharray="5 3"/>

        <!-- Legend -->
        <rect x="${padding.left + 20}" y="${padding.top + 10}" width="12" height="3" fill="#0284c7"/>
        <text x="${padding.left + 38}" y="${padding.top + 14}" font-size="10.5" font-weight="600" fill="#012743">R(t) Confiabilidad</text>
        
        <rect x="${padding.left + 160}" y="${padding.top + 10}" width="12" height="3" fill="#e11d48"/>
        <text x="${padding.left + 178}" y="${padding.top + 14}" font-size="10.5" font-weight="600" fill="#e11d48">F(t) Inconfiabilidad</text>
      </svg>
    `;

    el.reliabilityChartBox.innerHTML = svg;
  }

  // --- CHART 2: PARETO CHART OF FAILURE MODES (SVG) ---
  function renderParetoChart(modes) {
    if (!modes || modes.length === 0) return;

    // Filter out 'All modes' and take calendar modes or first unique
    const filtered = modes
      .filter(m => !m.mode.toLowerCase().includes('all') && m.severity !== 'All' && m.time_basis === 'calendar')
      .sort((a, b) => b.rate_mean - a.rate_mean)
      .slice(0, 6);

    const width = 500;
    const height = 260;
    const padding = { top: 25, right: 40, bottom: 65, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxRate = Math.max(...filtered.map(f => f.rate_mean), 10);
    const totalRate = filtered.reduce((acc, f) => acc + f.rate_mean, 0);

    const barW = Math.min(plotW / (filtered.length * 1.6), 40);
    const gap = (plotW - barW * filtered.length) / (filtered.length + 1);

    let cum = 0;
    const cumPoints = [];

    let barsHtml = '';
    filtered.forEach((f, i) => {
      const h = (f.rate_mean / maxRate) * plotH;
      const x = padding.left + gap + i * (barW + gap);
      const y = padding.top + plotH - h;

      cum += f.rate_mean;
      const cumPct = totalRate > 0 ? (cum / totalRate) : 0;
      const cumY = padding.top + (1 - cumPct) * plotH;
      const cumX = x + barW / 2;
      cumPoints.push(`${cumX.toFixed(1)},${cumY.toFixed(1)}`);

      // Severity bar color
      let barColor = '#0284c7';
      if (f.severity === 'Critical') barColor = '#d9383a';
      else if (f.severity === 'Degraded') barColor = '#f59e0b';
      else if (f.severity === 'Incipient') barColor = '#10b981';

      barsHtml += `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" fill="${barColor}" rx="3">
          <title>${f.mode} (${f.code}): λ = ${f.rate_mean.toFixed(2)} por 10⁶ h</title>
        </rect>
        <text x="${(x + barW / 2).toFixed(1)}" y="${y - 4}" font-size="9" font-weight="600" fill="#334155" text-anchor="middle">${f.rate_mean.toFixed(1)}</text>
        <text x="${(x + barW / 2).toFixed(1)}" y="${padding.top + plotH + 18}" font-size="9" fill="#1e293b" text-anchor="middle" font-weight="600">${f.code}</text>
        <text x="${(x + barW / 2).toFixed(1)}" y="${padding.top + plotH + 32}" font-size="7.5" fill="#64748b" text-anchor="middle">${escapeHtml(f.mode.slice(0, 11))}</text>
      `;
    });

    const cumLinePath = cumPoints.length > 0 ? `M ${cumPoints.join(' L ')}` : '';

    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <!-- Axes -->
        <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="${padding.left + plotW}" y1="${padding.top}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#e2e8f0" stroke-dasharray="3"/>

        <!-- Y Axis Ticks Left (Rate) -->
        <text x="${padding.left - 8}" y="${padding.top + 4}" font-size="9" fill="#64748b" text-anchor="end">${maxRate.toFixed(0)}</text>
        <text x="${padding.left - 8}" y="${padding.top + plotH * 0.5 + 4}" font-size="9" fill="#64748b" text-anchor="end">${(maxRate * 0.5).toFixed(0)}</text>
        <text x="${padding.left - 8}" y="${padding.top + plotH + 4}" font-size="9" fill="#64748b" text-anchor="end">0</text>

        <!-- Y Axis Ticks Right (Cumulative %) -->
        <text x="${padding.left + plotW + 8}" y="${padding.top + 4}" font-size="9" fill="#6366f1" text-anchor="start">100%</text>
        <text x="${padding.left + plotW + 8}" y="${padding.top + plotH * 0.5 + 4}" font-size="9" fill="#6366f1" text-anchor="start">50%</text>

        <!-- Bars -->
        ${barsHtml}

        <!-- Cumulative Line -->
        <path d="${cumLinePath}" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="4 2"/>
        ${cumPoints.map(p => {
          const [cx, cy] = p.split(',');
          return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#6366f1"/>`;
        }).join('')}
      </svg>
    `;

    el.paretoChartBox.innerHTML = svg;
  }

  // --- CHART 3: MAINTAINABILITY M(t) CURVE ---
  function renderMaintainabilityChart(mttr) {
    const width = 500;
    const height = 260;
    const padding = { top: 20, right: 30, bottom: 40, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxT = Math.max(mttr * 4, 48); // 4x MTTR
    const pointsM = [];

    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxT;
      const m = 1 - Math.exp(-t / mttr);

      const x = padding.left + (t / maxT) * plotW;
      const y = padding.top + (1 - m) * plotH;
      pointsM.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const pathM = `M ${pointsM.join(' L ')}`;
    const areaM = `M ${padding.left},${padding.top + plotH} L ${pointsM.join(' L ')} L ${padding.left + plotW},${padding.top + plotH} Z`;

    // MTTR marker point
    const xMttr = padding.left + (mttr / maxT) * plotW;
    const yMttr = padding.top + (1 - (1 - Math.exp(-1))) * plotH; // 63.2%

    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left + plotW}" y2="${padding.top}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + plotH * 0.5}" x2="${padding.left + plotW}" y2="${padding.top + plotH * 0.5}" stroke="#e2e8f0" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>

        <!-- Y Axis Ticks -->
        <text x="${padding.left - 10}" y="${padding.top + 4}" font-size="10" fill="#64748b" text-anchor="end">1.0 (100%)</text>
        <text x="${padding.left - 10}" y="${padding.top + plotH * 0.5 + 4}" font-size="10" fill="#64748b" text-anchor="end">0.5 (50%)</text>
        <text x="${padding.left - 10}" y="${padding.top + plotH + 4}" font-size="10" fill="#64748b" text-anchor="end">0.0</text>

        <!-- X Axis Ticks -->
        <text x="${padding.left}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">0 h</text>
        <text x="${xMttr.toFixed(1)}" y="${padding.top + plotH + 20}" font-size="10" fill="#10b981" font-weight="700" text-anchor="middle">MTTR (${mttr.toFixed(1)}h)</text>
        <text x="${padding.left + plotW}" y="${padding.top + plotH + 20}" font-size="10" fill="#64748b" text-anchor="middle">${maxT.toFixed(0)} h</text>

        <!-- Curve -->
        <path d="${areaM}" fill="url(#gradM)"/>
        <path d="${pathM}" fill="none" stroke="#10b981" stroke-width="2.5"/>

        <!-- MTTR Point -->
        <line x1="${xMttr.toFixed(1)}" y1="${yMttr.toFixed(1)}" x2="${xMttr.toFixed(1)}" y2="${padding.top + plotH}" stroke="#10b981" stroke-dasharray="3 3"/>
        <line x1="${padding.left}" y1="${yMttr.toFixed(1)}" x2="${xMttr.toFixed(1)}" y2="${yMttr.toFixed(1)}" stroke="#10b981" stroke-dasharray="3 3"/>
        <circle cx="${xMttr.toFixed(1)}" cy="${yMttr.toFixed(1)}" r="4" fill="#10b981"/>
        <text x="${xMttr + 8}" y="${yMttr - 6}" font-size="10" font-weight="600" fill="#047857">M(MTTR) = 63.2%</text>
      </svg>
    `;

    el.maintainabilityChartBox.innerHTML = svg;
  }

  // --- CHART 4: GAMMA UNCERTAINTY BOUNDS (LOWER, MEAN, UPPER) ---
  function renderGammaUncertaintyChart(modes) {
    if (!modes || modes.length === 0) return;

    const filtered = modes
      .filter(m => m.time_basis === 'calendar' && m.rate_mean > 0)
      .slice(0, 6);

    const width = 500;
    const height = 260;
    const padding = { top: 25, right: 30, bottom: 45, left: 110 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxUpper = Math.max(...filtered.map(f => f.rate_upper), 20);
    const rowH = plotH / filtered.length;

    let rowsSvg = '';
    filtered.forEach((f, i) => {
      const y = padding.top + i * rowH + rowH / 2;

      const xLower = padding.left + (f.rate_lower / maxUpper) * plotW;
      const xMean = padding.left + (f.rate_mean / maxUpper) * plotW;
      const xUpper = padding.left + (f.rate_upper / maxUpper) * plotW;

      rowsSvg += `
        <!-- Label -->
        <text x="${padding.left - 10}" y="${y + 4}" font-size="9" fill="#1e293b" font-weight="600" text-anchor="end">
          ${escapeHtml(f.mode.slice(0, 15))}
        </text>

        <!-- Interval Bar (90% Confidence) -->
        <line x1="${xLower.toFixed(1)}" y1="${y}" x2="${xUpper.toFixed(1)}" y2="${y}" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
        <!-- Whiskers -->
        <line x1="${xLower.toFixed(1)}" y1="${y - 5}" x2="${xLower.toFixed(1)}" y2="${y + 5}" stroke="#64748b" stroke-width="2"/>
        <line x1="${xUpper.toFixed(1)}" y1="${y - 5}" x2="${xUpper.toFixed(1)}" y2="${y + 5}" stroke="#64748b" stroke-width="2"/>

        <!-- Mean Point -->
        <circle cx="${xMean.toFixed(1)}" cy="${y}" r="4.5" fill="#012743"/>
        <text x="${xMean.toFixed(1)}" y="${y - 7}" font-size="8.5" font-weight="700" fill="#012743" text-anchor="middle">
          ${f.rate_mean.toFixed(1)}
        </text>
      `;
    });

    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <!-- Axes -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>

        <!-- X ticks -->
        <text x="${padding.left}" y="${padding.top + plotH + 18}" font-size="9" fill="#64748b" text-anchor="middle">0</text>
        <text x="${padding.left + plotW * 0.5}" y="${padding.top + plotH + 18}" font-size="9" fill="#64748b" text-anchor="middle">${(maxUpper * 0.5).toFixed(0)}</text>
        <text x="${padding.left + plotW}" y="${padding.top + plotH + 18}" font-size="9" fill="#64748b" text-anchor="middle">${maxUpper.toFixed(0)} por 10⁶ h</text>

        ${rowsSvg}
      </svg>
    `;

    el.gammaChartBox.innerHTML = svg;
  }

  // --- RENDER COMPARATOR (2002 vs 2009 vs 2015) ---
  function renderComparator() {
    const item = getSelectedItem();
    if (!item) return;

    const eqClass = item.equipment_class;

    // Find equivalent equipment in each edition
    const ed2002 = window.OREDA_DATA.items.find(x => x.edition === '2002' && (x.equipment_class === eqClass || x.family === item.family)) || null;
    const ed2009 = window.OREDA_DATA.items.find(x => x.edition === '2009' && (x.equipment_class === eqClass || x.family === item.family)) || null;
    const ed2015 = window.OREDA_DATA.items.find(x => x.edition === '2015' && (x.equipment_class === eqClass || x.family === item.family)) || null;

    const editions = [
      { name: 'OREDA 2002', ed: '2002', tag: '4ª Edición', data: ed2002 },
      { name: 'OREDA 2009', ed: '2009', tag: '5ª Edición (Referencia)', data: ed2009, highlight: true },
      { name: 'OREDA 2015', ed: '2015', tag: '6ª Edición', data: ed2015 }
    ];

    let html = '';
    const historyPoints = [];

    editions.forEach(e => {
      const d = e.data;
      const allMode = d ? d.failure_modes.find(m => m.mode.toLowerCase().includes('all') || m.severity === 'All') : null;
      const rateMean = allMode ? allMode.rate_mean : 0;
      const mttrMean = allMode ? allMode.active_repair_mean : 0;

      historyPoints.push({
        edition: e.ed,
        rate: rateMean,
        mttr: mttrMean,
        pop: d ? d.population : 0
      });

      html += `
        <div class="edition-card ${e.highlight ? 'highlight' : ''}">
          <div class="edition-card-header">
            <span class="edition-badge-large">${e.name}</span>
            <span class="pill-tag" style="background: var(--surface-highest);">${e.tag}</span>
          </div>

          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            ${d ? escapeHtml(d.name) : 'No catalogado en esta edición'}
          </div>

          <div class="edition-stat-list">
            <div class="edition-stat-row">
              <span class="stat-label">Población de Equipos:</span>
              <span class="stat-val">${d ? d.population : 'N/A'}</span>
            </div>
            <div class="edition-stat-row">
              <span class="stat-label">Instalaciones Vigiladas:</span>
              <span class="stat-val">${d ? d.installations : 'N/A'}</span>
            </div>
            <div class="edition-stat-row">
              <span class="stat-label">Tasa Falla Global (λ):</span>
              <span class="stat-val" style="color: #0284c7;">${rateMean > 0 ? rateMean.toFixed(2) : 'N/A'} por 10⁶ h</span>
            </div>
            <div class="edition-stat-row">
              <span class="stat-label">MTBF Estimado:</span>
              <span class="stat-val">${rateMean > 0 ? Math.round(1e6 / rateMean).toLocaleString() + ' h' : 'N/A'}</span>
            </div>
            <div class="edition-stat-row">
              <span class="stat-label">MTTR Activo:</span>
              <span class="stat-val">${mttrMean > 0 ? mttrMean.toFixed(1) + ' h' : 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    });

    el.comparatorGrid.innerHTML = html;

    // Render Historical Evolution Chart
    renderCompareHistoryChart(historyPoints);
  }

  // --- CHART 5: HISTORICAL EVOLUTION BAR CHART (SVG) ---
  function renderCompareHistoryChart(points) {
    const width = 600;
    const height = 240;
    const padding = { top: 30, right: 30, bottom: 40, left: 60 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxRate = Math.max(...points.map(p => p.rate), 100);
    const barW = 60;
    const gap = (plotW - barW * points.length) / (points.length + 1);

    let barsHtml = '';
    points.forEach((p, i) => {
      const h = (p.rate / maxRate) * plotH;
      const x = padding.left + gap + i * (barW + gap);
      const y = padding.top + plotH - h;

      barsHtml += `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="#012743" rx="4">
          <title>${p.edition}: λ = ${p.rate.toFixed(2)} por 10⁶ h</title>
        </rect>
        <text x="${x + barW / 2}" y="${y - 6}" font-size="11" font-weight="700" fill="#012743" text-anchor="middle">
          ${p.rate.toFixed(1)}
        </text>
        <text x="${x + barW / 2}" y="${padding.top + plotH + 20}" font-size="11" font-weight="600" fill="#1e293b" text-anchor="middle">
          OREDA ${p.edition}
        </text>
      `;
    });

    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
        
        <text x="${padding.left - 10}" y="${padding.top + 4}" font-size="10" fill="#64748b" text-anchor="end">${maxRate.toFixed(0)}</text>
        <text x="${padding.left - 10}" y="${padding.top + plotH * 0.5 + 4}" font-size="10" fill="#64748b" text-anchor="end">${(maxRate * 0.5).toFixed(0)}</text>
        <text x="${padding.left - 10}" y="${padding.top + plotH + 4}" font-size="10" fill="#64748b" text-anchor="end">0</text>

        ${barsHtml}
      </svg>
    `;

    el.compareHistoryChartBox.innerHTML = svg;
  }

  // --- SIMULATOR & REDUNDANCY CALCULATOR ---
  function updateSimulator() {
    const item = getSelectedItem();
    if (!item) return;

    const opHours = parseFloat(el.simHours.value) || 8760;
    const costPerHour = parseFloat(el.simCostPerHour.value) || 15000;

    const allMode = item.failure_modes.find(m => m.mode.toLowerCase().includes('all') || m.severity === 'All') || item.failure_modes[0];
    const lambda = allMode ? (allMode.rate_mean / 1e6) : 0.0001;

    let mttr = parseFloat(el.simCustomMttr.value);
    if (!mttr || isNaN(mttr)) {
      mttr = allMode ? allMode.active_repair_mean : 17.0;
      el.simCustomMttr.value = mttr.toFixed(1);
    }

    const mttf = lambda > 0 ? 1 / lambda : 100000;

    // Single Unit 1oo1:
    // A_1oo1 = MTTF / (MTTF + MTTR)
    const a1oo1 = mttf / (mttf + mttr);
    const q1oo1 = 1 - a1oo1;
    const down1oo1 = q1oo1 * opHours;
    const cost1oo1 = down1oo1 * costPerHour;

    // Redundant 1oo2 (Active Standby / Parallel):
    // Q_1oo2 = Q^2
    const q1oo2 = q1oo1 * q1oo1;
    const a1oo2 = 1 - q1oo2;
    const down1oo2 = q1oo2 * opHours;
    const cost1oo2 = down1oo2 * costPerHour;

    // Redundant 2oo3 (Triple Modular Redundancy / Voting):
    // Q_2oo3 = 3*Q^2 - 2*Q^3
    const q2oo3 = 3 * Math.pow(q1oo1, 2) - 2 * Math.pow(q1oo1, 3);
    const a2oo3 = 1 - q2oo3;
    const down2oo3 = q2oo3 * opHours;
    const cost2oo3 = down2oo3 * costPerHour;

    // Series 2oo2 (Both required):
    // A_2oo2 = A^2
    const a2oo2 = a1oo1 * a1oo1;
    const q2oo2 = 1 - a2oo2;
    const down2oo2 = q2oo2 * opHours;
    const cost2oo2 = down2oo2 * costPerHour;

    const configs = [
      { name: '1oo1 (Simple)', a: a1oo1, down: down1oo1, cost: cost1oo1, desc: 'Un solo equipo en servicio' },
      { name: '1oo2 (Redundante Standby)', a: a1oo2, down: down1oo2, cost: cost1oo2, desc: '1 operativo, 1 en reserva activa' },
      { name: '2oo3 (Votación Seguridad)', a: a2oo3, down: down2oo3, cost: cost2oo3, desc: 'Arquitectura TMR / ESD' },
      { name: '2oo2 (Serie / Requiere Ambos)', a: a2oo2, down: down2oo2, cost: cost2oo2, desc: 'Ambos equipos indispensables' }
    ];

    let html = '';
    configs.forEach(c => {
      html += `
        <div class="sim-res-box">
          <div class="sim-res-title">${c.name}</div>
          <div class="sim-res-num" style="color: ${c.a >= 0.999 ? '#059669' : '#012743'};">
            ${(c.a * 100).toFixed(4)}%
          </div>
          <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.35rem;">
            Parada: <strong>${c.down.toFixed(1)} h/año</strong>
          </div>
          <div style="font-size: 0.74rem; color: #dc2626; font-weight: 600; margin-top: 0.2rem;">
            $${Math.round(c.cost).toLocaleString()} USD/año
          </div>
        </div>
      `;
    });

    el.simResultsGrid.innerHTML = html;
  }

  // --- EXPORT TO CSV ---
  function exportCsv() {
    const item = getSelectedItem();
    if (!item) return;

    let csv = '';
    // Header Info
    csv += `OREDA RELIABILITY REPORT - ISO 14224\r\n`;
    csv += `Equipo: ${item.name}\r\n`;
    csv += `Taxonomia: ${item.taxonomy_no} | Edicion: OREDA ${item.edition}\r\n`;
    csv += `Poblacion: ${item.population} | Instalaciones: ${item.installations}\r\n`;
    csv += `Horas Calendario: ${item.calendar_time_10e6} M-hrs | Horas Operacionales: ${item.operational_time_10e6} M-hrs\r\n\r\n`;

    // Table Header
    csv += `Modo de Falla,Codigo de la Falla,No de Fallas,Inferior (5%),Medio (theta*),Superior (95%),Ds (SD),n/t,Actividad Reparacion Hr.,Min.,Media,Maxima\r\n`;

    item.failure_modes.forEach(m => {
      const row = [
        `"${m.mode.replace(/"/g, '""')}"`,
        `"${m.code}"`,
        `"${m.no_failures}"`,
        m.rate_lower,
        m.rate_mean,
        m.rate_upper,
        m.rate_sd,
        m.rate_nt,
        m.active_repair_mean,
        m.repair_min,
        m.repair_mean,
        m.repair_max
      ];
      csv += row.join(',') + '\r\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OREDA_${item.edition}_${item.taxonomy_no.replace(/\./g, '_')}_Reporte.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Reporte CSV exportado exitosamente');
  }

  // --- COPY TSV TO CLIPBOARD (EXCEL-READY) ---
  function copyTsv() {
    const item = getSelectedItem();
    if (!item) return;

    let tsv = `Modo de Falla\tCodigo de la Falla\tNo de Fallas\tInferior\tMedio\tSuperior\tDs\tn/t\tActividad Reparación Hr.\tMin.\tMedia\tMaxima\n`;

    item.failure_modes.forEach(m => {
      tsv += `${m.mode}\t${m.code}\t${m.no_failures}\t${m.rate_lower}\t${m.rate_mean}\t${m.rate_upper}\t${m.rate_sd}\t${m.rate_nt}\t${m.active_repair_mean}\t${m.repair_min}\t${m.repair_mean}\t${m.repair_max}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      showToast('Tabla copiada al portapapeles (lista para pegar en Excel)');
    }).catch(err => {
      console.error(err);
      showToast('Error al copiar al portapapeles', 'error');
    });
  }

  // --- TOAST NOTIFICATION ---
  function showToast(msg, type = 'success') {
    el.toastText.textContent = msg;
    el.toastMsg.classList.add('show');
    setTimeout(() => {
      el.toastMsg.classList.remove('show');
    }, 3200);
  }

  // --- UTILS ---
  function formatNumber(val) {
    if (val == null || isNaN(val)) return '-';
    if (val >= 100) return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    if (val >= 10) return val.toFixed(2);
    if (val >= 0.01) return val.toFixed(2);
    if (val >= 0.0001) return val.toExponential(1);
    if (val === 0) return '0.0';
    return '-';
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

  // Auto-boot
  document.addEventListener('DOMContentLoaded', init);

})();
