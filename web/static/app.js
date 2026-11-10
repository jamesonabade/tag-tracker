(() => {
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  const t = (key, p) => (window.I18N ? window.I18N.t(key, p) : key);
  const fmt = (ts) => (window.I18N ? window.I18N.formatDateTime(ts) : new Date(ts * 1000).toLocaleString());
  const ago = (ts) => (window.I18N ? window.I18N.timeAgo(ts) : '');

  // Helper para ícones visuais FontAwesome 6 inteligentes por nome de tag
  function getTagMeta(name) {
    const s = (name || '').toLowerCase();
    if (s.includes('bike') || s.includes('bicicleta') || s.includes('cicl')) {
      return { fa: 'fa-solid fa-bicycle', colorClass: 'icon-bike' };
    }
    if (s.includes('carro') || s.includes('car')) {
      return { fa: 'fa-solid fa-car', colorClass: 'icon-car' };
    }
    if (s.includes('moto')) {
      return { fa: 'fa-solid fa-motorcycle', colorClass: 'icon-moto' };
    }
    if (s.includes('galaxy') || s.includes('phone') || s.includes('celular') || s.includes('s24')) {
      return { fa: 'fa-solid fa-mobile-screen', colorClass: 'icon-phone' };
    }
    if (s.includes('chave') || s.includes('key')) {
      return { fa: 'fa-solid fa-key', colorClass: 'icon-key' };
    }
    if (s.includes('mochila') || s.includes('bag') || s.includes('mala')) {
      return { fa: 'fa-solid fa-suitcase', colorClass: 'icon-bag' };
    }
    return { fa: 'fa-solid fa-location-dot', colorClass: 'icon-default' };
  }

  function tagIconFor(name) {
    const meta = getTagMeta(name);
    return `<i class="${meta.fa}"></i>`;
  }

  // Inicialização do Mapa (Sem controles padrão embutidos do Leaflet)
  const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView([20, 0], 2);

  const gsub = { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], maxZoom: 21, attribution: '&copy; Google' };
  const bases = {
    'Google Streets': { layer: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', gsub), imagery: false, label: 'Google Vias' },
    'Google Hybrid': { layer: L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', gsub), imagery: true, label: 'Google Híbrido' },
    'Google Satellite': { layer: L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', gsub), imagery: true, label: 'Google Satélite' },
    'OpenStreetMap': { layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }), imagery: false, label: 'OpenStreetMap' },
  };

  const layerKeys = Object.keys(bases);
  const applyImagery = (name) => document.body.classList.toggle('imagery', !!bases[name]?.imagery);
  const saved = store.get('layer');
  let currentLayerName = bases[saved] ? saved : 'Google Streets';
  bases[currentLayerName].layer.addTo(map);
  applyImagery(currentLayerName);

  function setBaseLayer(name) {
    if (!bases[name] || name === currentLayerName) return;
    map.removeLayer(bases[currentLayerName].layer);
    currentLayerName = name;
    bases[name].layer.addTo(map);
    applyImagery(name);
    store.set('layer', name);
    showMapToast(bases[name].label);
  }

  function cycleNextLayer() {
    const curIdx = layerKeys.indexOf(currentLayerName);
    const nextIdx = (curIdx + 1) % layerKeys.length;
    setBaseLayer(layerKeys[nextIdx]);
  }

  let toastTimer = null;
  function showMapToast(text) {
    const toast = $('mapToast');
    if (!toast) return;
    toast.textContent = text;
    toast.removeAttribute('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.setAttribute('hidden', '');
    }, 1800);
  }

  function getMapVisibleOffsets() {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      return {
        top: 70,
        bottom: 80,
        left: 410,
        right: 20
      };
    }
    let stateH = 380;
    if (currentSheetState === 'peek') stateH = 110;
    else if (currentSheetState === 'half') stateH = 380;
    else if (currentSheetState === 'full') stateH = Math.min(560, window.innerHeight - 74);
    
    // O carrossel fica 15px acima da folha inferior e tem altura de ~46px + folga
    const bottomCover = stateH + 75;
    return {
      top: 70,
      bottom: bottomCover,
      left: 10,
      right: 10
    };
  }

  function flyToDevice(lat, lon, zoom = 19, options = { animate: true, duration: 0.8 }) {
    if (lat == null || lon == null) return;

    // Se a folha estiver em tela cheia ('full'), recua para 'half' para liberar a visão do mapa
    if (window.innerWidth < 768 && currentSheetState === 'full') {
      setSheetState('half');
    }

    const offsets = getMapVisibleOffsets();
    const visibleW = Math.max(100, window.innerWidth - offsets.left - offsets.right);
    const visibleH = Math.max(120, window.innerHeight - offsets.top - offsets.bottom);

    // Alvo posicionado confortavelmente no centro da área livre acima do painel
    const targetVisibleX = offsets.left + visibleW / 2;
    const targetVisibleY = offsets.top + visibleH * 0.40;

    const mapCenter = map.getSize().divideBy(2);
    const shiftX = mapCenter.x - targetVisibleX;
    const shiftY = mapCenter.y - targetVisibleY;

    const targetLatLng = L.latLng(lat, lon);
    const targetPoint = map.project(targetLatLng, zoom);
    const centerPoint = L.point(targetPoint.x + shiftX, targetPoint.y + shiftY);
    const centerLatLng = map.unproject(centerPoint, zoom);

    map.flyTo(centerLatLng, zoom, options);
  }

  function triggerMaxZoom() {
    const d = devices.find((x) => x.id === deviceId);
    if (d && d.last_lat != null && d.last_lon != null) {
      flyToDevice(d.last_lat, d.last_lon, 19);
    }
  }

  // Conectar botões flutuantes externos do mapa (100% idênticos ao protótipo)
  const btnZoomIn = $('btnZoomIn');
  if (btnZoomIn) btnZoomIn.addEventListener('click', (e) => { e.stopPropagation(); map.zoomIn(); });
  const btnZoomOut = $('btnZoomOut');
  if (btnZoomOut) btnZoomOut.addEventListener('click', (e) => { e.stopPropagation(); map.zoomOut(); });
  const btnLayers = $('btnLayers');
  if (btnLayers) btnLayers.addEventListener('click', (e) => { e.stopPropagation(); cycleNextLayer(); });
  const btnRecenter = $('btnRecenter');
  if (btnRecenter) btnRecenter.addEventListener('click', (e) => { e.stopPropagation(); triggerMaxZoom(); });

  const layers = {
    track: L.layerGroup().addTo(map),
    devicePoints: L.layerGroup().addTo(map),
    networkPoints: L.layerGroup().addTo(map),
    live: L.layerGroup().addTo(map),
    play: L.layerGroup().addTo(map)
  };
  let devices = [], deviceId = store.get('device'), range = { h: store.get('range') || '168' };
  let points = [], fitted = false, playTimer = null;

  // Comunicação com Servidor ou Ponte Nativa Android
  const NATIVE = window.Native;

  async function api(path, opts = {}) {
    const r = await fetch(path, { credentials: 'same-origin', ...opts });
    if (r.status === 401) { location.href = '/login'; throw new Error('logged out'); }
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText);
    return r.json();
  }

  const data = {
    devices: () => NATIVE ? JSON.parse(NATIVE.devices()) : api('/api/devices'),
    history: (id, s, e) => NATIVE ? JSON.parse(NATIVE.history(id, s, e))
      : api(`/api/history/${encodeURIComponent(id)}?start=${s}&end=${e}`),
    pollNow: () => NATIVE ? NATIVE.pollNow() : api('/api/poll-now', { method: 'POST' }),
    locate: (id) => NATIVE ? NATIVE.locateNow(id) : api(`/api/locate/${encodeURIComponent(id)}`, { method: 'POST' }),
    sound: (id) => NATIVE ? NATIVE.playSound(id) : api(`/api/sound/${encodeURIComponent(id)}`, { method: 'POST' }),
    setParked: (on) => NATIVE ? NATIVE.setParked(on)
      : api('/api/guard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parked: on }) }),
    rename: (id, name) => NATIVE ? NATIVE.rename(id, name)
      : api(`/api/devices/${encodeURIComponent(id)}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }),
  };

  function km(a, b) {
    const R = 6371, r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Geocodificação reversa de endereço (Nominatim)
  const addrCache = {};
  async function addressFor(lat, lon) {
    const k = lat.toFixed(4) + ',' + lon.toFixed(4);
    if (addrCache[k] !== undefined) return addrCache[k];
    try {
      const lang = window.I18N ? (window.I18N.lang === 'pt-BR' ? 'pt-BR,pt' : 'en') : 'en';
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lon}&accept-language=${lang}`,
        { headers: { 'Accept': 'application/json' } });
      const j = await r.json();
      const a = j && j.display_name ? j.display_name.split(',').slice(0, 3).join(',').trim() : '';
      addrCache[k] = a; return a;
    } catch (e) { addrCache[k] = ''; return ''; }
  }

  function currentRange() {
    const now = Math.floor(Date.now() / 1000);
    if (range.h === 'today') { const d = new Date(); d.setHours(0, 0, 0, 0); return [Math.floor(d / 1000), now]; }
    if (range.h === 'custom') return [range.start, range.end];
    return [now - Number(range.h) * 3600, now];
  }

  // ---------- Gerenciamento e Exibição de Tags ----------
  async function loadDevices() {
    const res = await data.devices();
    devices = res.devices || [];
    
    // Atualiza o select legado
    const sel = $('device');
    if (sel) {
      sel.innerHTML = devices.length ? devices.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')
        : `<option value="">${t('no_tags_waiting')}</option>`;
    }

    if (!devices.find((d) => d.id === deviceId)) deviceId = devices[0]?.id || null;
    if (deviceId && sel) sel.value = deviceId;

    // Renderiza o Carrossel Horizontal Moderno
    renderTagCarousel();
    renderLatest();

    const p = res.poller || {};
    const pollStatusEl = $('pollStatus');
    if (pollStatusEl) {
      pollStatusEl.textContent = !p.enabled ? t('poll_disabled')
        : p.running ? t('poll_checking')
        : p.last_error ? t('poll_failed', p.last_error)
        : p.last_run ? t('poll_last_checked', [ago(p.last_run), p.interval_minutes]) : t('poll_starting');
    }

    renderSync(res.backup);
    renderPark(res.guard);
    renderLicense(res.license);
  }

  // Suporte a clicar e arrastar (Click & Drag) e rolagem com a roda do mouse no carrossel de tags
  let isCarMouseDown = false;
  let carStartX = 0;
  let carScrollLeft = 0;
  let carHasDragged = false;
  const carDragThreshold = 5;

  function initCarouselDrag(car) {
    if (!car || car._dragInitialized) return;
    car._dragInitialized = true;

    // Evita o arrasto nativo de imagens/elementos do navegador
    car.addEventListener('dragstart', (e) => e.preventDefault());

    // Rolagem horizontal suave com a roda do mouse (dispensa Shift + Scroll)
    car.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        car.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Arrasto com o clique do mouse (Click & Drag)
    car.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Apenas botão principal (esquerdo)
      isCarMouseDown = true;
      carHasDragged = false;
      carStartX = e.pageX - car.offsetLeft;
      carScrollLeft = car.scrollLeft;
      car.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isCarMouseDown) return;
      const x = e.pageX - car.offsetLeft;
      const walk = (x - carStartX);
      if (Math.abs(walk) > carDragThreshold) {
        carHasDragged = true;
      }
      if (carHasDragged) {
        e.preventDefault();
        car.scrollLeft = carScrollLeft - walk;
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isCarMouseDown) return;
      isCarMouseDown = false;
      car.classList.remove('is-dragging');
      // Mantém carHasDragged por um pequeno intervalo para que o evento 'click' dos chips seja descartado
      setTimeout(() => {
        carHasDragged = false;
      }, 60);
    });

    // Intercepta e bloqueia o clique nos chips se o usuário estava arrastando a lista
    car.addEventListener('click', (e) => {
      if (carHasDragged) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }, true);
  }

  function renderTagCarousel() {
    const car = $('tagCarousel');
    if (!car) return;
    initCarouselDrag(car);
    if (!devices.length) {
      car.innerHTML = `<div class="tag-chip"><span class="tag-chip-name">${t('no_tags_waiting')}</span></div>`;
      return;
    }

    car.innerHTML = devices.map((d) => {
      const isAct = d.id === deviceId;
      const meta = getTagMeta(d.name);
      const timeStr = d.last_ts ? ago(d.last_ts) : t('no_locations_stored');
      return `<div class="tag-chip ${isAct ? 'active' : ''}" data-id="${esc(d.id)}">`
        + `<div class="tag-chip-icon ${meta.colorClass}"><i class="${meta.fa}"></i></div>`
        + `<div class="tag-chip-content">`
        + `<span class="tag-chip-name">${esc(d.name)}</span>`
        + `<span class="tag-chip-meta">${esc(timeStr)}</span>`
        + `</div></div>`;
    }).join('');

    car.querySelectorAll('.tag-chip[data-id]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id;
        const d = devices.find((x) => x.id === id);
        if (d && d.locked) { openLicense(); return; }
        deviceId = id;
        store.set('device', deviceId);
        const sel = $('device');
        if (sel) sel.value = deviceId;
        car.querySelectorAll('.tag-chip').forEach((c) => c.classList.toggle('active', c.dataset.id === id));
        renderLatest();
        if (d && d.last_lat != null && d.last_lon != null) {
          flyToDevice(d.last_lat, d.last_lon, 19);
          fitted = true;
        } else {
          fitted = false;
        }
        loadHistory().catch(alert);
      });
    });
  }

  let licensed = true;
  function openLicense() {
    if (NATIVE && NATIVE.openLicense) NATIVE.openLicense();
    else alert(t('pro_alert'));
  }

  function renderLicense(lic) {
    licensed = !lic || lic.licensed !== false;
    const el = $('pro');
    if (!el) return;
    el.hidden = licensed;
    if (!licensed) { el.textContent = t('pro_upgrade'); el.onclick = openLicense; }
    document.querySelectorAll('#ranges button').forEach((b) => {
      const free = b.dataset.h === 'today' || b.dataset.h === '24';
      b.classList.toggle('locked', !licensed && !free);
    });
  }

  let parked = false;
  function renderPark(on) {
    parked = !!on;
    const guardCard = $('guardCard');
    const guardSubtitle = $('guardSubtitle');
    if (guardCard) guardCard.classList.toggle('armed', parked);
    if (guardSubtitle) {
      guardSubtitle.textContent = parked ? t('park_alert_armed') : t('park_card_desc');
    }
  }

  function renderSync(b) {
    const el = $('sync');
    if (!el) return;
    el.classList.remove('ok', 'busy', 'err', 'off');
    if (!b || !b.enabled) {
      el.classList.add('off'); el.textContent = t('sync_drive_off');
      el.title = t('sync_drive_off_tip');
    } else if (b.last_error) {
      el.classList.add('busy'); el.textContent = t('sync_pending');
      el.title = t('sync_pending_tip', b.last_error);
    } else if (b.last_run) {
      el.classList.add('ok'); el.textContent = t('sync_done');
      el.title = t('sync_done_tip', ago(b.last_run)) + (b.mode ? ` (${b.mode})` : '');
    } else {
      el.classList.add('off'); el.textContent = t('sync_ready');
      el.title = t('sync_ready_tip');
    }
  }

  function renderLatest() {
    const d = devices.find((x) => x.id === deviceId);
    const nameEl = $('activeTagName');
    const topTagName = $('topTagName');
    const el = $('latest');
    const dirBtn = $('dir');
    layers.live.clearLayers();

    if (!d) {
      if (nameEl) nameEl.textContent = 'Tag';
      if (topTagName) topTagName.textContent = 'Tag Tracker';
      if (el) el.innerHTML = `<span class="muted">${t('no_tag_selected')}</span>`;
      if (dirBtn) dirBtn.style.display = 'none';
      return;
    }

    if (nameEl) nameEl.textContent = d.name;
    if (topTagName) {
      topTagName.textContent = d.name;
      topTagName.title = d.name;
    }

    if (d.last_ts == null) {
      if (el) {
        el.innerHTML = `<span class="muted">${t('no_locations_stored')}</span>`
          + (d.last_error ? `<br><span class="error">${esc(d.last_error)}</span>` : '');
      }
      if (dirBtn) dirBtn.style.display = 'none';
      return;
    }

    const timeStr = ago(d.last_ts);
    if (el) {
      el.innerHTML = `<span id="addr" class="tag-address-text"><i class="fa-solid fa-location-dot" style="font-size: 11px; color: #94a3b8; margin-right: 3px;"></i> ${t('finding_address')}</span> <span class="tag-dot-sep">·</span> <span class="tag-time-subtle">${esc(timeStr)}</span>`
        + (d.last_error ? `<br><span class="error small">${esc(d.last_error)}</span>` : '');
    }

    if (dirBtn) {
      dirBtn.style.display = 'inline-flex';
      dirBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${d.last_lat},${d.last_lon}`;
    }

    addressFor(d.last_lat, d.last_lon).then((a) => {
      const ae = $('addr');
      if (ae) {
        const addrText = a || `${d.last_lat.toFixed(5)}, ${d.last_lon.toFixed(5)}`;
        ae.innerHTML = `<i class="fa-solid fa-location-dot" style="font-size: 11px; color: #94a3b8; margin-right: 3px;"></i> ${esc(addrText)}`;
      }
    });

    const ll = [d.last_lat, d.last_lon];
    if (d.last_accuracy) {
      L.circle(ll, { radius: d.last_accuracy, color: d.color, weight: 1, fillOpacity: 0.12 }).addTo(layers.live);
    }
    
    // Alfinete com balão para o ponto Mais recente (Z-Index Máximo 1000)
    const meta = getTagMeta(d.name);
    const latestDivIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="pin-balloon-latest">
               <div class="pin-badge-latest"><span class="ping-dot"></span><span class="pin-badge-text">Mais recente</span></div>
               <div class="pin-head-latest">
                 <div class="pin-pulse-latest"></div>
                 <i class="${meta.fa}"></i>
               </div>
               <div class="pin-stem-latest"></div>
             </div>`,
      iconSize: [120, 69],
      iconAnchor: [60, 69],
      popupAnchor: [0, -69]
    });

    L.marker(ll, { icon: latestDivIcon, zIndexOffset: 1000 })
      .bindPopup(`<div class="popup"><b>${t('popup_latest', esc(d.name))}</b>${fmt(d.last_ts)}<br>`
        + `<a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${d.last_lat},${d.last_lon}">${t('open_in_maps')}</a>`
        + ` · <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${d.last_lat},${d.last_lon}">${t('directions')}</a></div>`)
      .addTo(layers.live);
  }

  // ---------- Histórico de Trajetos & Filtros de Visualização ----------
  // Desenha o traçado conectando exclusivamente os pontos que passam pelos filtros ativos
  function renderTrack() {
    layers.track.clearLayers();
    const showTrack = $('showTrack') ? $('showTrack').checked : true;
    if (!showTrack) {
      if (map.hasLayer(layers.track)) map.removeLayer(layers.track);
      return;
    }

    const activePoints = getFilteredPoints();
    const d = devices.find((x) => x.id === deviceId);
    const color = d?.color || '#0284c7';
    const lls = activePoints.map((p) => [p.lat, p.lon]);
    
    if (lls.length > 1) {
      L.polyline(lls, { color, weight: 3.5, opacity: 0.85 }).addTo(layers.track);
    }

    if (!map.hasLayer(layers.track)) {
      map.addLayer(layers.track);
    }
  }

  // Obtém os pontos do histórico de acordo com os filtros de visualização selecionados
  function getFilteredPoints() {
    const showDev = $('showDevicePoints') ? $('showDevicePoints').checked : true;
    const showNet = $('showNetworkPoints') ? $('showNetworkPoints').checked : true;
    return points.filter((p) => {
      if (p.is_own_report) return showDev;
      return showNet;
    });
  }

  function updateLayersVisibility() {
    renderTrack();

    const showDev = $('showDevicePoints') ? $('showDevicePoints').checked : true;
    const showNet = $('showNetworkPoints') ? $('showNetworkPoints').checked : true;

    if (showDev) {
      if (!map.hasLayer(layers.devicePoints)) map.addLayer(layers.devicePoints);
    } else {
      if (map.hasLayer(layers.devicePoints)) map.removeLayer(layers.devicePoints);
    }

    if (showNet) {
      if (!map.hasLayer(layers.networkPoints)) map.addLayer(layers.networkPoints);
    } else {
      if (map.hasLayer(layers.networkPoints)) map.removeLayer(layers.networkPoints);
    }
  }

  async function loadHistory() {
    stopPlay();
    layers.track.clearLayers();
    layers.devicePoints.clearLayers();
    layers.networkPoints.clearLayers();
    layers.play.clearLayers();
    if (!deviceId) { points = []; renderStats(); return; }
    const d = devices.find((x) => x.id === deviceId);
    const [start, end] = currentRange();
    const res = await data.history(deviceId, start, end);
    points = (res.points || []).filter((p) => p.lat != null);

    // Posição e raio de precisão do ponto "Mais recente" para diferenciar pontos próximos e afastados
    const latestLat = (d && d.last_lat != null) ? d.last_lat : (points.length ? points[points.length - 1].lat : null);
    const latestLon = (d && d.last_lon != null) ? d.last_lon : (points.length ? points[points.length - 1].lon : null);
    const latestAccuracy = (d && d.last_accuracy != null) ? Number(d.last_accuracy) : (points.length && points[points.length - 1].accuracy ? Number(points[points.length - 1].accuracy) : 0);
    const hasLatest = latestLat != null && latestLon != null;

    // Rastreia balões já posicionados fora do raio para evitar sobreposição excessiva de alfinetes no mesmo local exato (< 15m)
    const placedDistantBalloons = [];

    points.forEach((p, i) => {
      if (p.is_own_report) {
        // Distância até o ponto mais recente
        const distFromLatest = hasLatest ? map.distance([p.lat, p.lon], [latestLat, latestLon]) : Infinity;
        // Ponto dentro do raio de precisão do ponto mais recente
        const isInsideRadius = hasLatest && (distFromLatest <= Math.max(15, latestAccuracy));

        if (isInsideRadius) {
          // Dentro do Raio (Próximos do ponto "Mais recente"):
          // Mantêm a aparência simples e discreta (circleMarker pequeno em azul #0284c7, borda branca e estático)
          L.circleMarker([p.lat, p.lon], {
            radius: 4.5,
            color: '#ffffff',
            weight: 1.5,
            fillColor: '#0284c7',
            fillOpacity: 0.9,
            zIndexOffset: 30
          })
          .bindPopup(`<div class="popup"><b><i class="fa-solid fa-mobile-screen-button" style="color: #0284c7; margin-right: 4px;"></i>Info dispositivo</b><br>${fmt(p.ts)}`
            + `${p.accuracy ? `<br>± ${Math.round(p.accuracy)} m` : ''}<br>`
            + `<span class="muted">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span></div>`)
          .addTo(layers.devicePoints);
        } else {
          // Fora do Raio (Pontos mais afastados):
          // Exibidos no formato de balão com alfinete e haste (pin-balloon-device), destacando a localização com badge "Info dispositivo"
          const hasNearbyBalloon = placedDistantBalloons.some((b) => map.distance([p.lat, p.lon], [b.lat, b.lon]) < 15);

          if (!hasNearbyBalloon) {
            placedDistantBalloons.push({ lat: p.lat, lon: p.lon });
            const devDivIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="pin-balloon-device">
                       <div class="pin-badge-device"><span class="pulse-dot"></span><span>Info dispositivo</span></div>
                       <div class="pin-head-device">
                         <i class="fa-solid fa-mobile-screen-button"></i>
                       </div>
                       <div class="pin-stem-device"></div>
                     </div>`,
              iconSize: [110, 58],
              iconAnchor: [55, 58],
              popupAnchor: [0, -58]
            });

            L.marker([p.lat, p.lon], {
              icon: devDivIcon,
              zIndexOffset: 600
            })
            .bindPopup(`<div class="popup"><b><i class="fa-solid fa-mobile-screen-button" style="color: #0284c7; margin-right: 4px;"></i>Info dispositivo</b><br>${fmt(p.ts)}`
              + `${p.accuracy ? `<br>± ${Math.round(p.accuracy)} m` : ''}<br>`
              + `<span class="muted">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span></div>`)
            .addTo(layers.devicePoints);
          } else {
            L.circleMarker([p.lat, p.lon], {
              radius: 4.5,
              color: '#ffffff',
              weight: 1.5,
              fillColor: '#0284c7',
              fillOpacity: 0.9,
              zIndexOffset: 35
            })
            .bindPopup(`<div class="popup"><b><i class="fa-solid fa-mobile-screen-button" style="color: #0284c7; margin-right: 4px;"></i>Info dispositivo</b><br>${fmt(p.ts)}`
              + `${p.accuracy ? `<br>± ${Math.round(p.accuracy)} m` : ''}<br>`
              + `<span class="muted">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span></div>`)
            .addTo(layers.devicePoints);
          }
        }
      } else {
        // Pontos normais do histórico (rede Find Hub) - Z-Index 10: pequenos marcadores circulares discretos em tom ardósia (#64748b)
        L.circleMarker([p.lat, p.lon], {
          radius: 4,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#64748b',
          fillOpacity: 0.85,
          zIndexOffset: 10
        })
        .bindPopup(`<div class="popup"><b><i class="fa-solid fa-tower-broadcast" style="color: #64748b; margin-right: 4px;"></i>${fmt(p.ts)}</b>${p.accuracy ? `± ${Math.round(p.accuracy)} m<br>` : ''}`
          + `${t('reported_by_network')}<br>`
          + `<span class="muted">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span></div>`)
        .addTo(layers.networkPoints);
      }
    });

    renderTrack();
    updateLayersVisibility();

    if (!fitted) {
      const activeLls = getFilteredPoints().map((p) => [p.lat, p.lon]);
      const lls = activeLls.length ? activeLls : points.map((p) => [p.lat, p.lon]);
      const bounds = lls.length ? L.latLngBounds(lls) : null;
      if (bounds) {
        const offsets = getMapVisibleOffsets();
        map.fitBounds(bounds, {
          paddingTopLeft: [offsets.left + 20, offsets.top + 20],
          paddingBottomRight: [offsets.right + 20, offsets.bottom + 20],
          maxZoom: 16
        });
      } else if (d?.last_lat != null) {
        flyToDevice(d.last_lat, d.last_lon, 16);
      }
      fitted = true;
    }
    
    updateScrubRange();
    renderStats();
  }

  function updateScrubRange() {
    const activePoints = getFilteredPoints();
    const scrub = $('scrub');
    const scrubLabel = $('scrubLabel');
    if (scrub) {
      scrub.max = Math.max(0, activePoints.length - 1);
      if (Number(scrub.value) > scrub.max) scrub.value = scrub.max;
    }
    if (scrubLabel) {
      if (!activePoints.length) {
        scrubLabel.textContent = 'Nenhum ponto no filtro';
      } else {
        const idx = scrub ? Number(scrub.value) : activePoints.length - 1;
        const p = activePoints[idx];
        if (p) {
          const timePart = fmt(p.ts).split(' ').pop();
          const typeLabel = p.is_own_report ? 'Info dispositivo' : 'Rede Find Hub';
          scrubLabel.textContent = `${timePart} (${idx + 1}/${activePoints.length} · ${typeLabel})`;
        }
      }
    }
  }

  function renderStats() {
    const activePoints = getFilteredPoints();
    let dist = 0;
    for (let i = 1; i < activePoints.length; i++) dist += km(activePoints[i - 1], activePoints[i]);
    const span = activePoints.length ? activePoints[activePoints.length - 1].ts - activePoints[0].ts : 0;
    const days = span / 86400;
    const numFmt = (n) => (window.I18N ? window.I18N.formatNumber(n) : n.toLocaleString());
    const statsEl = $('stats');
    if (!statsEl) return;
    const distVal = dist < 10 ? dist.toFixed(2) : numFmt(Math.round(dist));
    const durVal = days >= 1 ? `${days.toFixed(days < 10 ? 1 : 0)} <span class="stat-unit">d</span>` : `${Math.round(span / 3600)} <span class="stat-unit">h</span>`;
    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">${t('stat_points')}</div>
        <div class="stat-value">${numFmt(activePoints.length)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t('stat_distance')}</div>
        <div class="stat-value">${distVal} <span class="stat-unit">km</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t('stat_duration')}</div>
        <div class="stat-value">${durVal}</div>
      </div>
    `;
    const historyCount = $('historyCount');
    if (historyCount) {
      const countStr = numFmt(activePoints.length);
      historyCount.textContent = `${countStr} ${t('stat_locations')}`;
    }
  }

  // ---------- Replay / Reprodução Dinâmica com Filtro, Velocidade e Loop ----------
  let playSpeed = 1;
  let playLoop = false;

  const floatingReplayBar = $('floatingReplayBar');
  const floatPlayBtn = $('floatPlayBtn');
  const floatPlayIcon = $('floatPlayIcon');
  const floatStopBtn = $('floatStopBtn');
  const floatSpeedBtn = $('floatSpeedBtn');
  const floatLoopBtn = $('floatLoopBtn');
  const floatReplayTitle = $('floatReplayTitle');
  const floatReplaySub = $('floatReplaySub');
  const floatReplayBarFill = $('floatReplayBarFill');
  const loopBtn = $('loopBtn');

  function setPlaySpeed(speed) {
    playSpeed = Number(speed) || 1;
    document.querySelectorAll('.speed-chip').forEach((chip) => {
      chip.classList.toggle('on', Number(chip.dataset.speed) === playSpeed);
    });
    if (floatSpeedBtn) {
      floatSpeedBtn.textContent = playSpeed + 'x';
    }
    if (playTimer) {
      restartPlayTimer();
    }
  }

  function cyclePlaySpeed() {
    if (playSpeed === 1) setPlaySpeed(2);
    else if (playSpeed === 2) setPlaySpeed(4);
    else setPlaySpeed(1);
  }

  function togglePlayLoop() {
    playLoop = !playLoop;
    updateLoopVisuals();
  }

  function updateLoopVisuals() {
    if (loopBtn) {
      loopBtn.classList.toggle('active', playLoop);
    }
    if (floatLoopBtn) {
      floatLoopBtn.classList.toggle('active', playLoop);
    }
  }

  function getStepMs(count) {
    const baseStepMs = Math.max(150, Math.min(850, 20000 / Math.max(1, count)));
    return Math.max(40, Math.round(baseStepMs / playSpeed));
  }

  function updateFloatingMiniPlayer(idx, activePoints, p, labelText) {
    if (!floatingReplayBar) return;
    const d = devices.find((x) => x.id === deviceId);
    if (floatReplayTitle) floatReplayTitle.textContent = d ? d.name : 'Replay do Percurso';
    if (floatReplaySub) floatReplaySub.textContent = labelText || `Ponto ${idx + 1} de ${activePoints.length}`;
    if (floatReplayBarFill && activePoints.length > 1) {
      const pct = Math.round((idx / (activePoints.length - 1)) * 100);
      floatReplayBarFill.style.width = pct + '%';
    }
  }

  function setPlayButtonState(isPlaying) {
    if (floatPlayIcon) {
      floatPlayIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    const playBtn = $('play');
    if (playBtn) {
      playBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
      playBtn.title = isPlaying ? t('pause') : t('play');
    }
  }

  function showAt(i) {
    layers.play.clearLayers();
    const activePoints = getFilteredPoints();
    const p = activePoints[i];
    if (!p) return;
    const color = devices.find((d) => d.id === deviceId)?.color || '#0284c7';

    // Traçado percorrido até o momento no replay
    if (activePoints.length > 1) {
      L.polyline(activePoints.slice(0, i + 1).map((q) => [q.lat, q.lon]), {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.95
      }).addTo(layers.play);
    }

    // Marcador dinâmico do ponto no replay
    L.circleMarker([p.lat, p.lon], {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: p.is_own_report ? '#0284c7' : '#f59e0b',
      fillOpacity: 1
    }).addTo(layers.play);

    const typeLabel = p.is_own_report ? 'Info dispositivo' : 'Rede Find Hub';
    const timePart = fmt(p.ts).split(' ').pop();
    const labelText = `${timePart} (${i + 1}/${activePoints.length} · ${typeLabel})`;

    const scrubLabel = $('scrubLabel');
    if (scrubLabel) scrubLabel.textContent = labelText;

    updateFloatingMiniPlayer(i, activePoints, p, labelText);

    if (!map.getBounds().contains([p.lat, p.lon])) {
      flyToDevice(p.lat, p.lon, map.getZoom(), { animate: true, duration: 0.4 });
    }
  }

  function stopPlay() {
    clearInterval(playTimer);
    playTimer = null;
    setPlayButtonState(false);
    if (floatingReplayBar) floatingReplayBar.hidden = true;
  }

  function restartPlayTimer() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    const activePoints = getFilteredPoints();
    if (!activePoints.length) return;

    const scrub = $('scrub');
    const stepMs = getStepMs(activePoints.length);

    playTimer = setInterval(() => {
      const currentVal = Number(scrub.value);
      const nextIdx = currentVal + 1;
      if (nextIdx >= activePoints.length) {
        if (playLoop) {
          scrub.value = 0;
          showAt(0);
          return;
        }
        clearInterval(playTimer);
        playTimer = null;
        setPlayButtonState(false);
        return;
      }
      scrub.value = nextIdx;
      showAt(nextIdx);
    }, stepMs);
  }

  function startOrResumePlay() {
    const activePoints = getFilteredPoints();
    if (!activePoints.length) {
      alert('Nenhum ponto selecionado nos filtros de visualização.');
      return;
    }

    // 1. O mapa se estende recolhendo a folha para 'peek'
    setSheetState('peek');

    // 2. Enquadra e deixa visíveis todos os pontos selecionados no filtro
    const lls = activePoints.map((p) => [p.lat, p.lon]);
    if (lls.length > 0) {
      const bounds = L.latLngBounds(lls);
      const offsets = getMapVisibleOffsets();
      map.fitBounds(bounds, {
        paddingTopLeft: [offsets.left + 30, offsets.top + 30],
        paddingBottomRight: [offsets.right + 30, offsets.bottom + 30],
        maxZoom: 18,
        animate: true
      });
    }

    const scrub = $('scrub');
    if (Number(scrub.value) >= activePoints.length - 1) scrub.value = 0;

    if (floatingReplayBar) floatingReplayBar.hidden = false;
    setPlayButtonState(true);

    const initialIdx = Number(scrub.value);
    showAt(initialIdx);

    restartPlayTimer();
  }

  const scrubEl = $('scrub');
  if (scrubEl) {
    scrubEl.addEventListener('input', (e) => {
      stopPlay();
      showAt(Number(e.target.value));
    });
  }

  const playBtn = $('play');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (playTimer) stopPlay();
      else startOrResumePlay();
    });
  }

  if (floatPlayBtn) {
    floatPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
        setPlayButtonState(false);
      } else {
        startOrResumePlay();
      }
    });
  }

  if (floatStopBtn) {
    floatStopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopPlay();
      layers.play.clearLayers();
    });
  }

  // Controles de Velocidade (Card e Mini Player Flutuante)
  document.querySelectorAll('.speed-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setPlaySpeed(Number(btn.dataset.speed));
    });
  });

  if (floatSpeedBtn) {
    floatSpeedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cyclePlaySpeed();
    });
  }

  // Controles de Loop (Card e Mini Player Flutuante)
  if (loopBtn) {
    loopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayLoop();
    });
  }

  if (floatLoopBtn) {
    floatLoopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayLoop();
    });
  }

  // ---------- Controles e Estados da Folha Inferior (Idêntico ao Protótipo Aprovado) ----------
  let currentSheetState = 'half'; // 'peek', 'half', 'full'

  function setSheetState(state) {
    currentSheetState = state;
    const panel = $('panel');
    const carouselWrapper = document.querySelector('.tag-carousel-wrapper');
    if (!panel) return;

    panel.classList.add('sheet-transition');
    if (carouselWrapper) carouselWrapper.classList.add('carousel-transition');

    const maxH = Math.min(560, window.innerHeight - 74);
    if (state === 'peek') {
      panel.style.height = '110px';
      if (carouselWrapper) carouselWrapper.style.bottom = '125px';
    } else if (state === 'half') {
      panel.style.height = '380px';
      if (carouselWrapper) carouselWrapper.style.bottom = '395px';
    } else if (state === 'full') {
      panel.style.height = maxH + 'px';
      if (carouselWrapper) carouselWrapper.style.bottom = (maxH + 15) + 'px';
    }

    panel.classList.remove('state-peek', 'state-half', 'state-full');
    panel.classList.add('state-' + state);

    const toggleText = $('toggleText');
    const toggle = $('toggle');
    const toggleIcon = $('toggleIcon');
    if (toggleText) {
      toggleText.textContent = state === 'peek' ? 'Expandir painel' : 'Recolher painel';
    }
    if (toggle) {
      toggle.classList.toggle('is-collapsed', state === 'peek');
    }
    if (toggleIcon) {
      toggleIcon.style.transform = state === 'peek' ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    const content = $('sheetContent');
    if (content && (state === 'peek' || state === 'half')) {
      content.scrollTop = 0;
    }
    if (state !== 'peek' && floatingReplayBar) {
      floatingReplayBar.hidden = true;
    }
  }

  function cycleSheetState() {
    if (currentSheetState === 'half') setSheetState('full');
    else if (currentSheetState === 'full') setSheetState('peek');
    else setSheetState('half');
  }

  function toggleSheetCollapse() {
    if (currentSheetState === 'peek') {
      setSheetState('half');
    } else {
      setSheetState('peek');
    }
  }

  // Arrasto em tempo real 1:1 acompanhando o dedo (Touch e Mouse)
  function initBottomSheetDrag() {
    const panel = $('panel');
    const handleZone = $('sheetHandleZone');
    const headerCard = document.querySelector('.active-tag-card');
    const carouselWrapper = document.querySelector('.tag-carousel-wrapper');
    if (!panel || !handleZone) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;
    let currentHeight = 0;
    let didMove = false;

    function onDragStart(clientY, target) {
      if (target && (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select'))) return;
      isDragging = true;
      didMove = false;
      startY = clientY;
      startHeight = panel.getBoundingClientRect().height;
      currentHeight = startHeight;
      panel.classList.remove('sheet-transition');
      if (carouselWrapper) carouselWrapper.classList.remove('carousel-transition');
    }

    function onDragMove(clientY) {
      if (!isDragging) return;
      const deltaY = clientY - startY;
      if (Math.abs(deltaY) > 5) didMove = true;
      let newHeight = startHeight - deltaY;
      const minH = 90;
      const maxH = Math.min(560, window.innerHeight - 74);

      // Amortecimento elástico nos extremos
      if (newHeight < minH) newHeight = minH + (newHeight - minH) * 0.25;
      if (newHeight > maxH + 40) newHeight = (maxH + 40) + (newHeight - (maxH + 40)) * 0.25;

      currentHeight = newHeight;
      panel.style.height = newHeight + 'px';
      if (carouselWrapper) {
        carouselWrapper.style.bottom = (newHeight + 15) + 'px';
      }
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      panel.classList.add('sheet-transition');
      if (carouselWrapper) carouselWrapper.classList.add('carousel-transition');

      if (!didMove) {
        cycleSheetState();
        return;
      }

      // Snap suave baseado na altura final do arrasto
      if (currentHeight < 240) {
        setSheetState('peek');
      } else if (currentHeight < 480) {
        setSheetState('half');
      } else {
        setSheetState('full');
      }
    }

    // Touch mobile
    handleZone.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientY, e.target), { passive: true });
    if (headerCard) headerCard.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientY, e.target), { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isDragging) onDragMove(e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', onDragEnd);
    window.addEventListener('touchcancel', onDragEnd);

    // Mouse desktop / emulador
    handleZone.addEventListener('mousedown', (e) => onDragStart(e.clientY, e.target));
    if (headerCard) headerCard.addEventListener('mousedown', (e) => onDragStart(e.clientY, e.target));

    window.addEventListener('mousemove', (e) => {
      if (isDragging) onDragMove(e.clientY);
    });
    window.addEventListener('mouseup', onDragEnd);
  }
  initBottomSheetDrag();
  setSheetState('half');

  window.setSheetState = setSheetState;
  window.flyToDevice = flyToDevice;
  window.triggerMaxZoom = triggerMaxZoom;

  window.addEventListener('resize', () => {
    if (currentSheetState === 'full') {
      const maxH = Math.min(560, window.innerHeight - 74);
      const panel = $('panel');
      const carouselWrapper = document.querySelector('.tag-carousel-wrapper');
      if (panel) panel.style.height = maxH + 'px';
      if (carouselWrapper) carouselWrapper.style.bottom = (maxH + 15) + 'px';
    }
  });

  const toggleBtn = $('toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSheetCollapse);
  }

  // ---------- Filtros de Período ----------
  function markRange() {
    document.querySelectorAll('#ranges button').forEach((b) => b.classList.toggle('on', b.dataset.h === range.h));
    const customCard = $('custom');
    if (customCard) {
      if (range.h === 'custom') {
        customCard.removeAttribute('hidden');
        customCard.style.display = 'grid';
      } else {
        customCard.setAttribute('hidden', '');
        customCard.style.display = 'none';
      }
    }
  }
  const rangesEl = $('ranges');
  if (rangesEl) {
    rangesEl.addEventListener('click', (e) => {
      const h = e.target.dataset?.h; if (!h) return;
      if (!licensed && !(h === 'today' || h === '24')) { openLicense(); return; }
      range = { h }; markRange();
      if (h === 'custom') {
        const toLocal = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        $('to').value ||= toLocal(new Date()); $('from').value ||= toLocal(new Date(Date.now() - 7 * 86400000));
        return;
      }
      store.set('range', h); fitted = false; loadHistory().catch(alert);
    });
  }

  const applyCustomBtn = $('applyCustom');
  if (applyCustomBtn) {
    applyCustomBtn.addEventListener('click', () => {
      const s = new Date($('from').value), en = new Date($('to').value);
      if (isNaN(s) || isNaN(en) || s >= en) return alert(t('invalid_date_range'));
      range = { h: 'custom', start: Math.floor(s / 1000), end: Math.floor(en / 1000) };
      fitted = false; loadHistory().catch(alert);
    });
  }

  // Compatibilidade com Select de Dispositivos Legado
  const deviceSel = $('device');
  if (deviceSel) {
    deviceSel.addEventListener('change', (e) => {
      const d = devices.find((x) => x.id === e.target.value);
      if (d && d.locked) { openLicense(); e.target.value = deviceId; return; }
      deviceId = e.target.value; store.set('device', deviceId); fitted = false;
      renderTagCarousel(); renderLatest(); loadHistory().catch(alert);
    });
  }

  if ($('showTrack')) {
    const savedTrack = store.get('showTrack');
    if (savedTrack !== null) $('showTrack').checked = savedTrack !== '0';
    $('showTrack').addEventListener('change', () => {
      store.set('showTrack', $('showTrack').checked ? '1' : '0');
      updateLayersVisibility();
    });
  }

  if ($('showDevicePoints')) {
    const savedDev = store.get('showDevicePoints');
    if (savedDev !== null) $('showDevicePoints').checked = savedDev !== '0';
    $('showDevicePoints').addEventListener('change', () => {
      store.set('showDevicePoints', $('showDevicePoints').checked ? '1' : '0');
      updateLayersVisibility();
      updateScrubRange();
      renderStats();
    });
  }

  if ($('showNetworkPoints')) {
    const savedNet = store.get('showNetworkPoints');
    if (savedNet !== null) $('showNetworkPoints').checked = savedNet !== '0';
    $('showNetworkPoints').addEventListener('change', () => {
      store.set('showNetworkPoints', $('showNetworkPoints').checked ? '1' : '0');
      updateLayersVisibility();
      updateScrubRange();
      renderStats();
    });
  }

  if ($('showPoints')) {
    $('showPoints').addEventListener('change', () => updateLayersVisibility());
  }

  const pollNowBtn = $('pollNow');
  if (pollNowBtn) {
    pollNowBtn.addEventListener('click', async () => {
      try {
        await data.pollNow();
        const pollStatusEl = $('pollStatus');
        if (pollStatusEl) pollStatusEl.textContent = t('poll_checking');
        setTimeout(refresh, 15000);
      } catch (e) { alert(e.message); }
    });
  }

  const download = (f) => {
    if (!deviceId) return;
    if (!licensed) { openLicense(); return; }
    const [start, end] = currentRange();
    if (NATIVE) NATIVE.export(deviceId, start, end, f);
    else location.href = `/api/history/${encodeURIComponent(deviceId)}?start=${start}&end=${end}&format=${f}`;
  };
  if ($('csv')) $('csv').addEventListener('click', () => download('csv'));
  if ($('gpx')) $('gpx').addEventListener('click', () => download('gpx'));

  async function locateNow() {
    if (!deviceId) return;
    const d = devices.find((x) => x.id === deviceId);
    if (d && d.last_lat != null && d.last_lon != null) {
      flyToDevice(d.last_lat, d.last_lon, 19);
    }
    const btn = $('locate');
    if (!btn) return;
    btn.disabled = true;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = `<div class="action-icon text-sky"><i class="fa-solid fa-spinner fa-spin text-base text-sky-400"></i></div><span class="action-label">${t('locating')}</span>`;
    const pollStatusEl = $('pollStatus');
    if (pollStatusEl) pollStatusEl.textContent = t('asking_location');
    const done = () => { btn.disabled = false; btn.innerHTML = oldHtml; };
    try {
      await data.locate(deviceId);
    } catch (e) {
      if (pollStatusEl) pollStatusEl.textContent = e.message;
      done(); return;
    }
    if (NATIVE) {
      let tCount = 0;
      const iv = setInterval(async () => { await refresh(); if (++tCount >= 8) { clearInterval(iv); done(); } }, 4000);
    } else {
      await refresh(); done();
    }
  }

  const locateBtn = $('locate');
  if (locateBtn) locateBtn.addEventListener('click', locateNow);

  const parkBtn = $('park');
  if (parkBtn) {
    parkBtn.addEventListener('click', async () => {
      if (!licensed) { openLicense(); return; }
      const next = !parked;
      renderPark(next);
      try { await data.setParked(next); } catch (e) { alert(e.message); }
      const pollStatusEl = $('pollStatus');
      if (pollStatusEl) {
        pollStatusEl.textContent = next ? t('park_alert_armed') : t('park_alert_idle');
      }
      refresh();
    });
  }

  const ringBtn = $('ring');
  if (ringBtn) {
    ringBtn.addEventListener('click', async () => {
      if (!deviceId) return;
      try {
        await data.sound(deviceId);
        const pollStatusEl = $('pollStatus');
        if (pollStatusEl) pollStatusEl.textContent = t('ringing');
      } catch (e) { alert(e.message); }
    });
  }

  const shareBtn = $('share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const d = devices.find((x) => x.id === deviceId);
      if (!d || d.last_lat == null) { alert(t('share_no_location')); return; }
      const addr = await addressFor(d.last_lat, d.last_lon);
      const text = `${t('share_last_seen', [d.name, fmt(d.last_ts)])}\n${addr ? addr + '\n' : ''}`
        + `https://www.google.com/maps?q=${d.last_lat},${d.last_lon}`;
      if (NATIVE && NATIVE.share) NATIVE.share(text);
      else if (navigator.share) { try { await navigator.share({ title: d.name, text }); } catch (e) {} }
      else { try { await navigator.clipboard.writeText(text); alert(t('share_copied')); } catch (e) { prompt('Copy:', text); } }
    });
  }

  // ---------- Modal Moderno de Renomear Tag (Substitui window.prompt) ----------
  const renameModal = $('renameModal');
  const renameInput = $('renameInput');

  function openRenameModal() {
    const d = devices.find((x) => x.id === deviceId);
    if (!d || !renameModal) return;
    renameInput.value = d.name || '';
    renameModal.hidden = false;
    setTimeout(() => renameInput.focus(), 80);
  }

  function closeRenameModal() {
    if (renameModal) renameModal.hidden = true;
  }

  async function submitRename() {
    const d = devices.find((x) => x.id === deviceId);
    if (!d || !renameInput) return;
    const newName = renameInput.value.trim();
    if (!newName) return;
    closeRenameModal();
    await data.rename(d.id, newName);
    refresh();
  }

  const renameBtn = $('rename');
  if (renameBtn) renameBtn.addEventListener('click', openRenameModal);
  if ($('cancelRename')) $('cancelRename').addEventListener('click', closeRenameModal);
  if ($('closeRenameModal')) $('closeRenameModal').addEventListener('click', closeRenameModal);
  if ($('saveRename')) $('saveRename').addEventListener('click', submitRename);
  if (renameInput) {
    renameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitRename();
      if (e.key === 'Escape') closeRenameModal();
    });
  }
  if (renameModal) {
    renameModal.addEventListener('click', (e) => {
      if (e.target === renameModal) closeRenameModal();
    });
  }

  if (window.TagTrackerApp) {
    const serverBtn = $('server');
    if (serverBtn) {
      serverBtn.hidden = false;
      serverBtn.addEventListener('click', () => window.TagTrackerApp.changeServer());
    }
  }

  // Botão de Configurações / Sair na Barra Superior
  const logoutBtn = $('logout');
  if (logoutBtn) {
    if (NATIVE) {
      logoutBtn.addEventListener('click', () => NATIVE.openSettings());
    } else {
      logoutBtn.addEventListener('click', async () => {
        await api('/api/logout', { method: 'POST' });
        location.href = '/login';
      });
    }
  }

  // Seletor de Idioma
  const langSel = $('langSelect');
  if (langSel && window.I18N) {
    langSel.value = window.I18N.lang;
    langSel.addEventListener('change', () => {
      window.I18N.setLang(langSel.value);
    });
  }

  if (window.I18N) {
    window.I18N.onChange(() => {
      if (recenterBtn) recenterBtn.title = t('center_on_tag');
      refresh();
    });
  }

  async function refresh() {
    try {
      await loadDevices();
      if (!playTimer) await loadHistory();
    } catch (e) {
      console.error(e);
    }
  }
  window.refreshApp = refresh;
  setInterval(() => {
    const autoRefresh = $('autoRefresh');
    if (autoRefresh && autoRefresh.checked && !document.hidden) refresh();
  }, 60000);

  if (range.h === 'custom') range.h = '168';
  markRange();
  refresh();
})();
