(() => {
  const STORAGE_KEY = 'tt_lang';

  const translations = {
    'en': {
      // General & Header
      'app_title': 'Tag Tracker',
      'app_subtitle': "Your tag's full travel history & anti-theft alerts",
      'sync_drive': 'Drive',
      'sync_drive_off': 'Drive off',
      'sync_drive_off_tip': 'Google Drive sync is off. Turn it on in setup.',
      'sync_pending': 'Sync pending',
      'sync_pending_tip': 'Your locations ARE saved on the phone. Drive sync will retry automatically. ({0})',
      'sync_done': 'Synced',
      'sync_done_tip': 'Backed up to Google Drive {0}',
      'sync_ready': 'Drive ready',
      'sync_ready_tip': 'Google Drive is set up. It uploads once there are locations to back up.',
      'pro_free': '🔒 Free',
      'pro_upgrade': '🔒 Upgrade',
      'pro_tip': 'Unlock Pro',
      'pro_alert': 'Free: 1 tag, last 24h. For 2+ tags and unlimited-day history, contact the developer for a key (jamesonabade@gmail.com).',
      'toggle_panel': 'Hide/show panel',
      'lang_label': 'Language',

      // Device Selection & Latest
      'label_tag': 'Tag',
      'no_tags_waiting': 'No tags yet – waiting for first check',
      'no_tag_selected': 'No tag selected.',
      'no_locations_stored': 'No locations stored yet.',
      'last_seen_at': 'Last seen at {0}',
      'locations_stored_count': '{0} locations',
      'finding_address': 'finding address…',
      'get_directions': 'Routes',
      'popup_latest': '{0} – latest',
      'open_in_maps': 'Open in Maps',
      'directions': 'Directions',

      // Park & Guard
      'park_btn_idle': 'Park & guard',
      'park_btn_armed': 'Guarded — tap when you ride',
      'park_alert_armed': 'Guard armed & protected',
      'park_alert_idle': 'Riding mode: movement alerts are off.',
      'park_card_title': 'Anti-theft Guard',
      'park_card_desc': 'Sound alert if tag moves 150m',
      'cancel': 'Cancel',
      'save': 'Save',

      // Actions
      'locate_now': 'Locate',
      'locating': 'Locating…',
      'asking_location': 'Asking the tag for its current location…',
      'live_start': 'Live (experimental)',
      'live_stop': 'Stop live',
      'live_off': 'Off',
      'live_checking': 'Requesting an updated location from Google…',
      'live_new': 'New location reported at {0}',
      'live_waiting': 'No new position · last report: {0}',
      'live_no_location': 'Still waiting for the first position…',
      'live_no_tag': 'Select a tag first.',
      'live_busy': 'Previous location request is still finishing.',
      'live_error': 'Live request failed: {0}',
      'live_timeout': 'Google did not respond within the timeout.',
      'live_auto_stopped': 'Stopped after 3 failed requests.',
      'live_paused': 'Paused when leaving the map.',
      'live_expired': '30-minute session ended. Start again to continue.',
      'live_experimental_tip': 'Experimental: new request at least 30s after the previous one finishes. Not continuous GPS.',
      'ring': 'Ring',
      'ringing': 'Ringing the tag…',
      'share': 'Share',
      'share_no_location': 'No location yet to share.',
      'share_last_seen': '{0} — last seen {1}',
      'share_copied': 'Location copied to clipboard',
      'share_title': 'Share location',
      'rename_tag': 'Rename tag',
      'rename_prompt': 'New name for this tag',

      // History Ranges
      'history_label': 'Route History',
      'range_today': 'Today',
      'range_24h': '24 h',
      'range_2d': '2 days',
      'range_7d': '7 days',
      'range_30d': '30 days',
      'range_90d': '90 days',
      'range_1y': '1 year',
      'range_custom': 'Custom',
      'custom_from': 'From',
      'custom_to': 'To',
      'custom_show': 'Show',
      'invalid_date_range': 'Pick a valid date range.',

      // Stats & Playback
      'stat_points': 'Points',
      'stat_distance': 'Distance',
      'stat_duration': 'Duration',
      'stat_locations': 'locations',
      'stat_km_travelled': 'km travelled',
      'stat_time_span': 'time span',
      'playback_label': 'Route Replay',
      'speed_label': 'Speed:',
      'loop': 'Loop',
      'play': 'Play',
      'pause': 'Pause',
      'unit_days': '{0} d',
      'unit_hours': '{0} h',

      // Options & Footer
      'map_points_title': 'Map Points',
      'map_filters_subtitle': 'View filters',
      'show_track': 'Show route track',
      'filter_device': 'Device info',
      'filter_network': 'Find Hub network',
      'show_points': 'Individual points',
      'auto_refresh': 'Auto-refresh',
      'check_now': 'Check now',
      'csv': 'CSV',
      'gpx': 'GPX',
      'change_server': 'Change server',
      'sign_out': 'Sign out',
      'settings': 'Settings',

      // Poller Status
      'poll_disabled': 'Automatic checking is off on this server.',
      'poll_checking': 'Checking Google for new locations…',
      'poll_failed': 'Last check failed: {0}',
      'poll_last_checked': 'Last checked {0} · every {1} min',
      'poll_starting': 'Starting…',

      // Map Points & Layers
      'reported_by_own': 'Reported by device',
      'reported_by_network': 'Reported by Find Hub network',
      'center_on_tag': 'Center on tag',
      'layer_osm': 'OpenStreetMap',
      'layer_google_streets': 'Google Streets',
      'layer_google_satellite': 'Google Satellite',
      'layer_google_hybrid': 'Google Hybrid',
      'layer_esri_satellite': 'Satellite (Esri)',

      // Time ago
      'time_just_now': 'just now',
      'time_min_ago': '{0} min ago',
      'time_hour_ago': '{0} h ago',
      'time_days_ago': '{0} days ago',

      // Login page
      'login_title': 'Tag Tracker – Sign in',
      'login_heading': 'Tag Tracker',
      'login_subtitle': "Sign in to see your tag's travel history.",
      'login_user': 'Username',
      'login_pass': 'Password',
      'login_btn': 'Sign in',
      'login_legal': 'Not affiliated with Google. Independent, open-source. For tracking your own property.',
      'login_failed': 'Wrong username or password',
      'login_too_many': 'Too many attempts. Try again in 15 minutes.',
      'login_generic_error': 'Sign in failed',

      // Help page
      'help_title': 'How Tag Tracker works',
      'help_hero_sub': "Your tag's full travel history & anti-theft alerts",
      'help_why_title': 'Why this app exists',
      'help_why_google_title': 'Google Find Hub',
      'help_why_google_desc': 'Shows only the <b>last</b> location. No history — you can\'t see where your tag has been.',
      'help_why_tt_title': 'Tag Tracker',
      'help_why_tt_desc': 'Saves <b>every</b> location over time: full route, day→year history, replay, and theft alerts.',
      'help_flow_title': 'How a location reaches your phone',
      'help_flow_1': 'Your tag broadcasts a tiny encrypted Bluetooth signal every 1–2 seconds.',
      'help_flow_2': 'Any Android phone passing nearby (~10–30 m) detects it and uploads the encrypted position to Google — silently and anonymously.',
      'help_flow_3': 'Your phone asks Google for it over the internet, and <b>only your phone</b> can decrypt it (that\'s the Unlock step).',
      'help_flow_4': 'It\'s drawn on your map, saved to history, and synced to Google Drive.',
      'help_flow_note': 'Updates come whenever a phone passes the tag — often in busy areas, rarely in empty ones. Your phone receives over the internet, so the tag can be anywhere.',
      'help_setup_title': 'First-time setup',
      'help_step_1_title': 'Sign in to Google',
      'help_step_1_desc': 'Use the account your tag is on. This lists your tags.',
      'help_step_2_title': 'Unlock encryption',
      'help_required': 'required',
      'help_step_2_desc': 'Enter your phone\'s screen lock on Google\'s page — this lets your phone decrypt locations. Without it the map stays empty.',
      'help_step_3_title': 'Turn on background checking',
      'help_step_3_desc': 'The app checks every 15 min and saves each location, using almost no battery.',
      'help_step_4_title': 'Sync to Google Drive',
      'help_recommended': 'recommended',
      'help_step_4_desc': 'Default mode auto-saves to your Drive, so a new phone gets your history back automatically.',
      'help_step_5_title': 'Park & guard',
      'help_step_5_desc': 'Tap Park when you leave the bike — you\'ll get a loud alert if it moves.',
      'help_features_title': 'What you can do',
      'help_features_desc': '• See the full route for Today, 2 days, 7 days, 30 days, a year, or any dates &nbsp; • Replay the trip &nbsp; • Ring the tag when you\'re near it &nbsp; • Export CSV/GPX for the police &nbsp; • Lock the app with a password &nbsp; • Switch between OpenStreetMap, Google Maps &amp; satellite.',
      'help_disclaimer_title': 'Before you start',
      'help_disclaimer_desc': '<b>Not affiliated with Google.</b> This is an independent app that uses an <b>unofficial</b> method to read the Find network. Google may block it at any time, and this may violate Google\'s Terms of Service. It\'s for tracking <b>your own property</b> — never a person without their consent. Use at your own risk.',
      'help_agree_check': 'I will only track <b>my own property</b> (not any person without consent), and I accept the disclaimer and that I use this at my own risk.',
      'help_start_btn': 'Agree & start setup'
    },
    'pt-BR': {
      // General & Header
      'app_title': 'Tag Tracker',
      'app_subtitle': 'Histórico completo de deslocamento e alertas antifurto para suas tags',
      'sync_drive': 'Drive',
      'sync_drive_off': 'Drive off',
      'sync_drive_off_tip': 'Sincronização com o Google Drive desativada. Ative nas configurações.',
      'sync_pending': 'Sinc pendente',
      'sync_pending_tip': 'Suas localizações ESTÃO salvas no dispositivo. A sincronização com o Drive tentará novamente automaticamente. ({0})',
      'sync_done': 'Sincronizado',
      'sync_done_tip': 'Backup no Google Drive {0}',
      'sync_ready': 'Drive pronto',
      'sync_ready_tip': 'Google Drive configurado. O envio ocorrerá quando houver localizações para backup.',
      'pro_free': '🔒 Grátis',
      'pro_upgrade': '🔒 Obter Pro',
      'pro_tip': 'Desbloquear versão Pro',
      'pro_alert': 'Versão grátis: 1 tag, últimas 24h. Para 2+ tags e histórico ilimitado, solicite uma chave ao desenvolvedor (jamesonabade@gmail.com).',
      'toggle_panel': 'Ocultar/exibir painel',
      'lang_label': 'Idioma',

      // Device Selection & Latest
      'label_tag': 'Tag',
      'no_tags_waiting': 'Nenhuma tag ainda – aguardando primeira verificação',
      'no_tag_selected': 'Nenhuma tag selecionada.',
      'no_locations_stored': 'Nenhuma localização salva ainda.',
      'last_seen_at': 'Visto pela última vez em {0}',
      'locations_stored_count': '{0} localizações',
      'finding_address': 'buscando endereço…',
      'get_directions': 'Rotas',
      'popup_latest': '{0} – mais recente',
      'open_in_maps': 'Abrir no Google Maps',
      'directions': 'Como chegar',

      // Park & Guard
      'park_btn_idle': 'Estacionar & proteger',
      'park_btn_armed': 'Protegido — toque ao sair',
      'park_alert_armed': 'Sentinela armado e protegido',
      'park_alert_idle': 'Modo passeio: alertas de movimento desativados.',
      'park_card_title': 'Alerta Antifurto',
      'park_card_desc': 'Disparar alarme se mover 150m',
      'cancel': 'Cancelar',
      'save': 'Salvar',

      // Actions
      'locate_now': 'Localizar',
      'locating': 'Localizando…',
      'asking_location': 'Solicitando a localização atual da tag…',
      'live_start': 'Ao vivo (experimental)',
      'live_stop': 'Parar ao vivo',
      'live_off': 'Desligado',
      'live_checking': 'Solicitando nova localização ao Google…',
      'live_new': 'Nova localização registrada às {0}',
      'live_waiting': 'Sem nova posição · último registro: {0}',
      'live_no_location': 'Aguardando a primeira localização…',
      'live_no_tag': 'Selecione uma tag primeiro.',
      'live_busy': 'A consulta anterior ainda está terminando.',
      'live_error': 'Falha na consulta ao vivo: {0}',
      'live_timeout': 'O Google não respondeu dentro do limite.',
      'live_auto_stopped': 'Interrompido após 3 falhas consecutivas.',
      'live_paused': 'Pausado ao sair do mapa.',
      'live_expired': 'Sessão de 30 minutos encerrada. Ative novamente.',
      'live_experimental_tip': 'Experimental: nova consulta pelo menos 30s após a anterior terminar. Não é GPS contínuo.',
      'ring': 'Tocar som',
      'ringing': 'Tocando a tag…',
      'share': 'Compartilhar',
      'share_no_location': 'Nenhuma localização para compartilhar ainda.',
      'share_last_seen': '{0} — visto pela última vez em {1}',
      'share_copied': 'Localização copiada para a área de transferência',
      'share_title': 'Compartilhar localização',
      'rename_tag': 'Renomear tag',
      'rename_prompt': 'Novo nome para esta tag',

      // History Ranges
      'history_label': 'Histórico de Rota',
      'range_today': 'Hoje',
      'range_24h': '24 h',
      'range_2d': '2 dias',
      'range_7d': '7 dias',
      'range_30d': '30 dias',
      'range_90d': '90 dias',
      'range_1y': '1 ano',
      'range_custom': 'Personalizado',
      'custom_from': 'De',
      'custom_to': 'Até',
      'custom_show': 'Exibir',
      'invalid_date_range': 'Selecione um intervalo de datas válido.',

      // Stats & Playback
      'stat_points': 'Pontos',
      'stat_distance': 'Distância',
      'stat_duration': 'Duração',
      'stat_locations': 'localizações',
      'stat_km_travelled': 'km percorridos',
      'stat_time_span': 'tempo decorrido',
      'playback_label': 'Replay do Percurso',
      'speed_label': 'Velocidade:',
      'loop': 'Loop',
      'play': 'Reproduzir',
      'pause': 'Pausar',
      'unit_days': '{0} d',
      'unit_hours': '{0} h',

      // Options & Footer
      'map_points_title': 'Pontos do Mapa',
      'map_filters_subtitle': 'Filtros de visualização',
      'show_track': 'Exibir traçado',
      'filter_device': 'Info dispositivo',
      'filter_network': 'Rede Find Hub',
      'show_points': 'Pontos individuais',
      'auto_refresh': 'Auto-atualizar',
      'check_now': 'Verificar agora',
      'csv': 'CSV',
      'gpx': 'GPX',
      'change_server': 'Trocar servidor',
      'sign_out': 'Sair',
      'settings': 'Configurações',

      // Poller Status
      'poll_disabled': 'Verificação automática desativada neste servidor.',
      'poll_checking': 'Consultando o Google por novas localizações…',
      'poll_failed': 'Última verificação falhou: {0}',
      'poll_last_checked': 'Última checagem {0} · a cada {1} min',
      'poll_starting': 'Iniciando…',

      // Map Points & Layers
      'reported_by_own': 'Reportado pelo dispositivo',
      'reported_by_network': 'Reportado pela rede Find Hub',
      'center_on_tag': 'Centralizar na tag',
      'layer_osm': 'OpenStreetMap',
      'layer_google_streets': 'Google Vias',
      'layer_google_satellite': 'Google Satélite',
      'layer_google_hybrid': 'Google Híbrido',
      'layer_esri_satellite': 'Satélite (Esri)',

      // Time ago
      'time_just_now': 'agora mesmo',
      'time_min_ago': 'há {0} min',
      'time_hour_ago': 'há {0} h',
      'time_days_ago': 'há {0} dias',

      // Login page
      'login_title': 'Tag Tracker – Entrar',
      'login_heading': 'Tag Tracker',
      'login_subtitle': 'Entre para visualizar o histórico de deslocamento da sua tag.',
      'login_user': 'Usuário',
      'login_pass': 'Senha',
      'login_btn': 'Entrar',
      'login_legal': 'Não afiliado ao Google. Independente e de código aberto. Para rastreamento de propriedade própria.',
      'login_failed': 'Usuário ou senha incorretos',
      'login_too_many': 'Muitas tentativas. Tente novamente em 15 minutos.',
      'login_generic_error': 'Falha ao entrar',

      // Help page
      'help_title': 'Como o Tag Tracker funciona',
      'help_hero_sub': 'Histórico completo de deslocamento e alertas antifurto para suas tags',
      'help_why_title': 'Por que este app existe',
      'help_why_google_title': 'Google Find Hub',
      'help_why_google_desc': 'Mostra apenas a <b>última</b> localização. Sem histórico — não é possível ver por onde sua tag passou.',
      'help_why_tt_title': 'Tag Tracker',
      'help_why_tt_desc': 'Salva <b>todas</b> as localizações ao longo do tempo: percurso completo, histórico de 1 dia a 1 ano, replay e alertas de furto.',
      'help_flow_title': 'Como uma localização chega ao seu celular',
      'help_flow_1': 'Sua tag emite um pequeno sinal Bluetooth criptografado a cada 1–2 segundos.',
      'help_flow_2': 'Qualquer celular Android passando por perto (~10–30 m) detecta o sinal e envia a posição criptografada para o Google — de forma silenciosa e anônima.',
      'help_flow_3': 'Seu celular solicita os dados ao Google pela internet, e <b>apenas o seu celular</b> consegue descriptografá-los (etapa de Desbloqueio).',
      'help_flow_4': 'A rota é desenhada no mapa, gravada no histórico e sincronizada com o Google Drive.',
      'help_flow_note': 'As atualizações chegam sempre que um celular passa perto da tag — frequente em áreas movimentadas, raro em locais ermos. Seu celular recebe pela internet, logo a tag pode estar em qualquer lugar.',
      'help_setup_title': 'Configuração inicial',
      'help_step_1_title': 'Conecte sua conta Google',
      'help_step_1_desc': 'Use a mesma conta onde a tag está cadastrada. Isso lista seus rastreadores.',
      'help_step_2_title': 'Desbloqueie a criptografia',
      'help_required': 'obrigatório',
      'help_step_2_desc': 'Digite o bloqueio de tela do celular na página do Google — isso permite ao app descriptografar as posições. Sem isso, o mapa fica vazio.',
      'help_step_3_title': 'Ative a verificação em segundo plano',
      'help_step_3_desc': 'O app verifica a cada 15 min e salva cada localização, quase sem gastar bateria.',
      'help_step_4_title': 'Sincronize com o Google Drive',
      'help_recommended': 'recomendado',
      'help_step_4_desc': 'O modo padrão salva automaticamente no seu Drive, para que você recupere o histórico em outro celular.',
      'help_step_5_title': 'Estacione e proteja',
      'help_step_5_desc': 'Toque em Estacionar ao deixar sua bicicleta ou veículo — você receberá um alerta sonoro caso ela se mova.',
      'help_features_title': 'O que você pode fazer',
      'help_features_desc': '• Ver rotas completas para Hoje, 2 dias, 7 dias, 30 dias, 1 ano ou datas personalizadas &nbsp; • Replay do percurso &nbsp; • Tocar alarme na tag quando estiver próximo &nbsp; • Exportar CSV/GPX &nbsp; • Trocar entre OpenStreetMap, Google Maps e Satélite.',
      'help_disclaimer_title': 'Antes de começar',
      'help_disclaimer_desc': '<b>Não afiliado ao Google.</b> Este é um aplicativo independente que utiliza um método <b>não oficial</b> para ler a rede Find Hub. O Google pode alterar ou bloquear isso a qualquer momento. Use apenas para rastrear <b>seus próprios bens</b> — nunca uma pessoa sem seu consentimento. Uso por sua conta e risco.',
      'help_agree_check': 'Rastrearei apenas <b>meus próprios pertences</b> (nunca uma pessoa sem consentimento), e aceito o termo de responsabilidade e uso por minha conta e risco.',
      'help_start_btn': 'Concordar & iniciar configuração'
    }
  };

  function detectLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) return saved;
    } catch (e) { }

    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('pt')) return 'pt-BR';
    return 'en';
  }

  let currentLang = detectLang();
  const listeners = [];

  function t(key, params) {
    let str = translations[currentLang]?.[key] ?? translations['en']?.[key] ?? key;
    if (params != null) {
      if (Array.isArray(params)) {
        params.forEach((v, i) => {
          str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), v);
        });
      } else if (typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
        });
      } else {
        str = str.replace(/\{0\}/g, params);
      }
    }
    return str;
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { }
    document.documentElement.lang = lang;
    applyDOM();
    listeners.forEach((fn) => {
      try { fn(currentLang); } catch (e) { console.error(e); }
    });
  }

  function applyDOM(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = t(key);
        } else {
          el.innerHTML = t(key);
        }
      }
    });

    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });

    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });

    // Update any language selector select elements
    root.querySelectorAll('.lang-select').forEach((sel) => {
      sel.value = currentLang;
    });
  }

  function timeAgo(ts) {
    const s = Date.now() / 1000 - ts;
    if (s < 90) return t('time_just_now');
    if (s < 3600) return t('time_min_ago', Math.round(s / 60));
    if (s < 86400) return t('time_hour_ago', Math.round(s / 3600));
    return t('time_days_ago', Math.round(s / 86400));
  }

  function formatDateTime(ts) {
    const locale = currentLang === 'pt-BR' ? 'pt-BR' : 'en-US';
    return new Date(ts * 1000).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function formatNumber(num, opts) {
    const locale = currentLang === 'pt-BR' ? 'pt-BR' : 'en-US';
    return Number(num).toLocaleString(locale, opts);
  }

  window.I18N = {
    get lang() { return currentLang; },
    translations,
    t,
    setLang,
    applyDOM,
    timeAgo,
    formatDateTime,
    formatNumber,
    onChange(fn) { listeners.push(fn); }
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyDOM());
  } else {
    applyDOM();
  }
})();

