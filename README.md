# Tag Tracker

**🌐 Site:** https://shekh-muhsen.github.io/tag-tracker-web/ &nbsp;·&nbsp;
**⬇ Baixar APK:** [Releases do GitHub](../../releases) &nbsp;·&nbsp;
**Licença:** Código aberto, GPL-3.0

Mantém o **histórico completo de localização** das suas tags da rede **Google Encontre Meu Dispositivo (Find Hub)** e exibe o trajeto detalhado no mapa.

O aplicativo oficial do Google mostra apenas onde a tag está *neste exato momento*. O **Tag Tracker** consulta a rede do Google a cada poucos minutos, **armazena cada coordenada recebida** e permite consultar o histórico de hoje, últimos 2 dias, 7 dias, 30 dias, 90 dias, 1 ano inteiro ou qualquer período personalizado.

- 📱 **Aplicativo Android Autônomo** (`android/`): Funciona 100% no próprio celular, consulta em segundo plano sem precisar de servidor ligado, faz backup no Google Drive e inclui modo vigia/antifurto.
- 🌐 **Painel Web com Login**: Exibe a rota no mapa interativo, permite animação/replay do percurso, estatísticas de velocidade, distância e tempo, além de exportação em CSV e GPX.
- 🔒 **Privacidade Total**: Suas localizações e credenciais do Google nunca saem do seu próprio aparelho ou servidor local.

---

## Como Funciona

```
Tag ──BLE──▶ Celulares Android próximos ──▶ Google Find Hub (criptografia de ponta a ponta)
                                                  │  a cada N minutos
                                                  ▼
                               Aplicativo Android / Servidor Tag Tracker
                               • Conecta à conta Google (uma única vez)
                               • Descriptografa com o bloqueio de tela e salva no SQLite
                                                  │
                                     Mapa Interativo e Alertas
```

O Google não oferece uma API pública para a rede Find. O projeto utiliza o módulo open-source [GoogleFindMyTools](https://github.com/leonboe1/GoogleFindMyTools), funcionando da mesma maneira que o aplicativo oficial Encontre Meu Dispositivo.

### Informações Importantes

- O histórico começa a ser gravado **a partir do momento em que o aplicativo/servidor é configurado**. O Google não armazena o histórico retroativo.
- A tag só atualiza sua posição quando algum celular Android passa perto dela via Bluetooth. Áreas com pouco movimento atualizam com menor frequência.
- No seu celular Android, abra as configurações do **Encontre Meu Dispositivo** e ative **"Encontrar dispositivos offline" → "Com rede em todas as áreas"** para obter a máxima taxa de localização.
- O intervalo de verificação padrão recomendado é de **15 minutos** (ideal para balancear atualizações frequentes e economia de bateria).

---

## 📱 Aplicativo Android (Modo Autônomo — Sem Servidor)

O aplicativo Android é **autônomo e independente**: conecta-se diretamente ao Google, consulta a rede em segundo plano via `WorkManager`, salva as localizações no banco de dados SQLite interno do aparelho e permite sincronização automática com o seu **Google Drive**.

### Configuração Inicial no Celular

Ao abrir o app pela primeira vez:
1. **Conectar conta Google:** Faça login com a mesma conta Google onde sua tag foi cadastrada.
2. **Desbloquear chaves de criptografia:** Digite o PIN, padrão ou senha de bloqueio de tela do celular na página do Google. Isso libera as chaves para que seu celular consiga descriptografar a localização da tag.
3. **Verificação em segundo plano:** Escolha o intervalo (mínimo de 15 minutos) e conceda permissão para execução em segundo plano sem otimização de bateria.
4. **Backup no Google Drive (Recomendado):** Escolha ou crie um arquivo no seu Google Drive (ex: `TagTracker-historico.csv`). O app atualizará seu histórico automaticamente.

Depois, clique em **Abrir mapa** para visualizar o mapa interativo, consultar rotas e reproduzir trajetos.

---

## 🔑 Sistema de Licenciamento e Vendas

O projeto possui um módulo nativo de licenciamento criptográfico **Ed25519** offline:

- **Controle de Licenças:** Cada celular possui um **ID do Dispositivo** exclusivo.

---

## 🖥️ Instalação do Servidor Web (Opcional — PC / Linux / Docker)

Caso queira hospedar uma central própria em um computador, VPS ou Raspberry Pi:

### Windows

Pré-requisitos: Python 3.11+, Git e Google Chrome instalado.

```powershell
# Clonar o repositório
git clone https://github.com/<seu-usuario>/tag-tracker.git
cd tag-tracker

# Instalação automática
powershell -ExecutionPolicy Bypass -File setup.ps1

# Criar usuário de acesso ao painel web
.\.venv\Scripts\python -m server.manage adduser meu_usuario

# Conectar a conta Google (abre o Chrome para login e PIN)
.\.venv\Scripts\python -m server.manage google-login

# Iniciar o servidor
.\start.ps1
```

Acesse `http://localhost:8000` no seu navegador e faça o login.

### Linux / Raspberry Pi / Docker

```sh
sh setup.sh
.venv/bin/python -m server.manage adduser meu_usuario
.venv/bin/python -m server
```

Ou via Docker:
```sh
docker compose up -d
docker compose exec tracker python -m server.manage adduser meu_usuario
```

### Variáveis de Ambiente do Servidor

| Variável | Padrão | Descrição |
|---|---|---|
| `TT_POLL_MINUTES` | `10` | Intervalo em minutos para consultar o Google Find |
| `TT_PORT` | `8000` | Porta do servidor web |
| `TT_DATA_DIR` | `./data` | Pasta do banco de dados SQLite e credenciais |
| `TT_COOKIE_SECURE` | `0` | Defina como `1` ao usar HTTPS |
| `TT_SESSION_DAYS` | `30` | Duração da sessão do usuário |
| `TT_RCLONE_REMOTE` | *(desativado)* | Destino de backup no Google Drive (ex: `gdrive:TagTracker`) |
| `TT_BACKUP_MINUTES` | `60` | Intervalo de backup em minutos |

---

## Comandos Administrativos

```powershell
python -m server.manage adduser <nome>   # Criar usuário ou redefinir senha
python -m server.manage deluser <nome>   # Remover usuário
python -m server.manage users            # Listar usuários
python -m server.manage poll             # Forçar uma consulta imediata às tags
python -m server.manage demo             # Gerar dados demonstrativos de teste
```

---

## Aspectos Legais, Isenção e Privacidade

- **Sem vínculo com o Google:** O Tag Tracker é um projeto independente. "Google", "Find Hub", "Find My Device", "Encontre Meu Dispositivo" e "Android" são marcas registradas da Google LLC.
- **Uso estritamente patrimonial:** Monitore apenas veículos, objetos e pertences de sua propriedade ou com autorização formal do proprietário. É proibido utilizar para rastrear pessoas sem consentimento.
- **Privacidade absoluta:** Os dados ficam armazenados exclusivamente no seu próprio celular/servidor e no seu Google Drive pessoal.
- Para os termos completos, consulte o arquivo [`LEGAL.md`](LEGAL.md).

---

## Licença

Distribuído sob os termos da licença **GNU General Public License v3.0 (GPL-3.0)**. Baseado na biblioteca GoogleFindMyTools desenvolvida por Leon Böttger.
