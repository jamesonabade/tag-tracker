# Tag Tracker

**🌐 Site:** https://shekh-muhsen.github.io/tag-tracker-web/ &nbsp;·&nbsp;
**⬇ Baixar APK:** [GitHub Actions do meu repositório](https://github.com/jamesonabade/tag-tracker/actions/workflows/android.yml) (APK disponível nos artefatos das execuções) ou [Releases do meu repositório](https://github.com/jamesonabade/tag-tracker/releases) &nbsp;·&nbsp;
**Código-fonte:** este repositório (código aberto, GPL-3.0)

Mantém o **histórico completo de localização** das suas tags da rede **Google Find Hub** e o exibe em um mapa.
O aplicativo Find Hub mostra apenas onde uma tag está *neste exato momento*. O Tag Tracker consulta o Find Hub a cada poucos minutos,
**salva todas as localizações obtidas** e permite consultar o histórico de hoje, dos últimos 2 dias, 7 dias, 30 dias, 90 dias, de
um ano inteiro ou de qualquer intervalo de datas que você escolher.

- 🌐 **Aplicação web** com login. Mostra o percurso no mapa, permite reproduzir a viagem, apresenta estatísticas de distância e tempo e exporta arquivos CSV ou GPX.
- 📱 **Aplicativo Android** (`android/`). O GitHub Actions compila o APK automaticamente.
- 🔒 Privado por padrão. Suas localizações e tokens do Google permanecem no seu próprio servidor, em `data/`.

## Como funciona

```
Tag ──BLE──▶ Celulares Android próximos ──▶ Google Find Hub (criptografia de ponta a ponta)
                                             │  a cada N minutos
                                             ▼
                          Servidor Tag Tracker (este repositório, executado no PC / VPS / Raspberry Pi)
                          • faz login na sua conta Google (uma única vez)
                          • descriptografa os relatórios e os armazena no SQLite
                                             │
                               navegador web  /  aplicativo Android  (login obrigatório)
```

O Google não oferece uma API pública para o Find Hub. O servidor utiliza o projeto de código aberto
[GoogleFindMyTools](https://github.com/leonboe1/GoogleFindMyTools), que funciona de maneira semelhante ao aplicativo oficial Find Hub.

**Informações importantes**

- O histórico começa **quando você inicia o servidor**. O Google não mantém o histórico antigo; por isso, não é possível carregar trajetos anteriores.
- O servidor só registra localizações **enquanto está em execução**. Para manter um histórico contínuo, execute-o em um equipamento sempre ligado, como uma VPS econômica, um Raspberry Pi ou um PC que fique ligado continuamente.
- A tag só informa uma localização quando um celular Android passa perto dela. Em lugares pouco movimentados, haverá menos registros.
- No seu celular, abra as configurações do Find Hub e ative **"Encontrar dispositivos off-line" → "Com a rede em todas as áreas"** para obter o máximo de relatórios.
- A integração utiliza uma API não oficial; portanto, uma mudança do Google pode interromper o funcionamento temporariamente. Caso isso aconteça, atualize o commit fixado do `GoogleFindMyTools` em `setup.ps1`, `setup.sh` e `Dockerfile`.
- Não configure um intervalo de consulta curto demais. Uma verificação a cada **10 minutos** (valor padrão) é razoável.

## 1. Instalar o servidor (Windows)

Você precisa do Python 3.11+, Git e Google Chrome.

```powershell
git clone https://github.com/<you>/tag-tracker.git
cd tag-tracker
powershell -ExecutionPolicy Bypass -File setup.ps1
```

Crie seu usuário de acesso ao painel web:

```powershell
.\.venv\Scripts\python -m server.manage adduser myname
```

Conecte sua conta Google (uma única vez):

```powershell
.\.venv\Scripts\python -m server.manage google-login
```

Uma janela do Chrome será aberta. Entre com a **conta Google que você usa no Find Hub**. O Google também pode solicitar
o **PIN ou padrão de bloqueio de tela** do seu celular, que desbloqueia a chave de criptografia das localizações das tags. Os tokens são salvos em
`data/google_secrets.json`. **Mantenha esse arquivo privado.** Ele permite acessar o seu Find Hub.

Inicie o servidor:

```powershell
.\start.ps1
```

Acesse http://localhost:8000 e faça login.

Quer testar o mapa antes de conectar sua tag? Execute `python -m server.manage demo` para adicionar uma tag de exemplo com um ano de histórico fictício.

### Linux / Raspberry Pi / VPS

```sh
sh setup.sh
.venv/bin/python -m server.manage adduser myname
# Servidores sem interface gráfica não têm Chrome. Execute google-login no seu PC Windows
# e depois copie data/google_secrets.json para a pasta data/ deste equipamento.
.venv/bin/python -m server
```

Ou utilize Docker: `docker compose up -d` e depois execute `docker compose exec tracker python -m server.manage adduser myname`.

### Configurações (variáveis de ambiente)

| Variável | Padrão | Significado |
|---|---|---|
| `TT_POLL_MINUTES` | `10` | Intervalo entre consultas ao Find Hub |
| `TT_PORT` | `8000` | Porta do servidor web |
| `TT_DATA_DIR` | `./data` | Pasta do banco de dados e das credenciais |
| `TT_COOKIE_SECURE` | `0` | Defina como `1` quando disponibilizar o site por HTTPS |
| `TT_SESSION_DAYS` | `30` | Duração da sessão do usuário |
| `TT_RCLONE_REMOTE` | *(desativado)* | Destino do backup no Google Drive, por exemplo, `gdrive:TagTracker` |
| `TT_BACKUP_MINUTES` | `60` | Frequência dos backups |

## Backup no Google Drive (mantenha seu histórico seguro na nuvem)

O servidor pode copiar seus dados para o Google Drive a cada hora. Ele envia:
- `tracker.db`: o banco de dados completo, que você pode restaurar em qualquer equipamento
- `csv/locations-YYYY-MM.csv`: um arquivo por mês, que pode ser aberto no Google Sheets

Os tokens de login do Google **nunca** são enviados.

1. Instale o [rclone](https://rclone.org/downloads/). No Windows, execute `winget install Rclone.Rclone`.
2. Conecte-o ao seu Drive: execute `rclone config` e escolha **n** (novo remoto). Dê o nome `gdrive`, escolha o armazenamento **drive** e deixe
   o ID e o segredo do cliente em branco. Escolha o escopo **1** (acesso completo) ou **3** (`drive.file`, que só enxerga arquivos criados pelo rclone). Aceite as demais opções
   e então entre na sua conta Google pelo navegador que será aberto.
3. Ative o backup antes de iniciar o servidor:
   ```powershell
   $env:TT_RCLONE_REMOTE = "gdrive:TagTracker"
   .\start.ps1
   ```
   Uma pasta `TagTracker` aparecerá no seu Drive. A linha de status da aplicação web exibirá quando o último backup foi realizado.

Outros comandos: `python -m server.manage backup` envia um backup imediatamente. `python -m server.manage restore` baixa o
backup do Drive para um novo equipamento. Pare o servidor antes de restaurar.

Com Docker, copie seu `rclone.conf` (execute `rclone config file` para localizá-lo) para `data/` e depois configure `TT_RCLONE_REMOTE` no `docker-compose.yml`.

## 2. Acessar pelo celular e de qualquer lugar

Escolha uma opção:

- **Tailscale** (mais fácil e privado): instale o Tailscale no servidor e no celular. Depois utilize `http://<server-tailscale-name>:8000`.
- **Cloudflare Tunnel** (endereço HTTPS público, sem alterar o roteador): execute `cloudflared tunnel --url http://localhost:8000` ou configure um túnel nomeado. Depois defina `TT_COOKIE_SECURE=1`.
- Uma VPS com proxy reverso (Caddy ou nginx) e HTTPS.

Não exponha a porta 8000 no roteador sem HTTPS.

## Aplicativo Android (funciona sozinho — sem servidor)

O aplicativo Android é **autônomo**: faz login no Google, consulta o Find Hub **em segundo plano**, armazena o
histórico no celular e faz backup no **Google Drive**. Você não precisa executar o servidor Python para usar o aplicativo.
(O servidor descrito acima é uma alternativa opcional para quem deseja um equipamento sempre ligado e acesso por navegador.)

**Instalação:** abra [**Actions → Android APK → execução mais recente**](https://github.com/jamesonabade/tag-tracker/actions/workflows/android.yml) no seu repositório GitHub e baixe o artefato
**TagTracker-apks** (ou obtenha o APK na [Release](https://github.com/jamesonabade/tag-tracker/releases) mais recente, quando houver). Descompacte, se necessário, copie para o celular e instale
(permita a instalação de aplicativos de fontes desconhecidas). Para publicar uma release com o APK anexado: `git tag v2.0 && git push --tags`.

**Na primeira execução**, será aberta uma tela de configuração:
1. **Entrar no Google** — uma página do Google será aberta; entre com a conta que você usa no Find Hub.
2. **Desbloquear as chaves de criptografia** — uma página do Google solicitará o bloqueio de tela do seu celular (PIN/padrão). Isso libera as
   chaves usadas para descriptografar a localização da tag. Sua senha e seu PIN são digitados nas páginas do próprio Google; o aplicativo nunca tem acesso a eles.
3. **Verificações em segundo plano** — escolha a frequência das consultas (mínimo de 15 minutos, um limite do Android) e toque em **Permitir execução
   em segundo plano** para que o Android não suspenda o aplicativo.
4. **Fazer backup no Google Drive** — toque em **Escolher arquivo do Google Drive** e crie um arquivo como `TagTracker-history.csv`
   no seu Drive. O aplicativo substitui o conteúdo desse arquivo pelo histórico completo a cada hora. Você pode abri-lo no Google Sheets.

Depois, toque em **Abrir mapa** para utilizar o mesmo mapa, os intervalos de histórico e a reprodução de trajetos da aplicação web.

*Como funciona sem o servidor:* o aplicativo inclui o código Python de localização (por meio do [Chaquopy](https://chaquo.com/chaquopy/)) e
o executa com o WorkManager do Android; assim, as verificações continuam com o aplicativo fechado e depois de uma reinicialização. Devido aos
limites de bateria do Android, o horário exato varia e o celular precisa estar conectado à internet quando uma verificação é executada.

*Observação sobre o Drive:* o aplicativo grava em **um arquivo do Drive escolhido por você**, usando o seletor de arquivos normal. Por isso, não é preciso configurar um projeto
no Google Cloud nem uma chave de API. A configuração de rclone do servidor não é necessária para o aplicativo Android.

*Opcional: assinatura estável.* Por padrão, cada compilação é assinada com uma chave de depuração temporária; portanto, para atualizar o
aplicativo, talvez seja necessário desinstalar a versão anterior. Para evitar isso, crie um keystore e adicione estes segredos ao repositório:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

## Comandos administrativos

```
python -m server.manage adduser <name>   # criar usuário ou redefinir a senha
python -m server.manage deluser <name>   # excluir usuário
python -m server.manage users            # listar usuários
python -m server.manage poll             # consultar localizações uma vez
```

## Aspectos legais, isenção de responsabilidade e privacidade

**Sem vínculo com o Google.** O Tag Tracker é um projeto independente, de código aberto — não foi criado,
endossado nem apoiado pela Google LLC. "Google", "Find Hub", "Find My Device" e "Android" são
marcas registradas da Google LLC, citadas apenas para identificar a compatibilidade.

O projeto consulta a rede Find com o [GoogleFindMyTools](https://github.com/leonboe1/GoogleFindMyTools), uma ferramenta **não oficial**.
O Google não oferece uma API pública e **pode bloquear essa integração a qualquer momento**; utilizar um cliente não oficial **pode violar
os Termos de Serviço do Google**. **Use por sua conta e risco**, inclusive quanto aos riscos para sua conta Google.

**Rastreie apenas seus próprios bens** — nunca uma pessoa sem o conhecimento e o consentimento dela (isso é ilegal em muitos lugares).
Se algum objeto for roubado, informe a localização à **polícia**; não confronte ninguém.

**Privacidade:** seus dados permanecem no celular e, se habilitado, no seu próprio Google Drive. O aplicativo **não possui
servidores próprios** e não envia dados ao desenvolvedor nem a terceiros.

Fornecido **"NO ESTADO EM QUE SE ENCONTRA"**, sem qualquer garantia. Consulte [`LEGAL.md`](LEGAL.md) para ler os termos completos.

## Licença

GPL-3.0, a mesma licença do GoogleFindMyTools, no qual o projeto se baseia. Todos os créditos a Leon Böttger.
