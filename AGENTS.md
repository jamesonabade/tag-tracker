# Diretrizes e Instruções para Agentes de IA (AGENTS.md)

Este documento define a arquitetura, convenções de código, processos de compilação e regras estritas para agentes de IA (como Antigravity, Cursor, Claude Code, GitHub Copilot ou scripts automatizados) que trabalham no repositório **Tag Tracker**.

---

## 1. Visão Geral da Arquitetura

O **Tag Tracker** é um ecossistema multiplataforma para rastreamento contínuo de histórico da rede Google Find Hub:

- **Android (`android/`)**: Aplicativo nativo em Java que utiliza **Chaquopy** (Python 3.11 embutido) para descriptografar os relatórios do Google Find Hub em segundo plano (via WorkManager) e apresenta a interface através de uma **WebView** local com Tailwind CSS e JavaScript nativo.
- **Servidor Web / Backend (`server/`)**: Aplicação **FastAPI** assíncrona (Python 3.11+) com SQLite, gerenciamento de usuários, agendamento de polling contínuo e sincronização opcional com Google Drive via rclone.
- **Frontend Compartilhado (`web/`)**: Arquivos HTML5, Tailwind CSS, Leaflet/MapLibre e JavaScript vanilla compartilhados entre o servidor web e o aplicativo Android (copiados automaticamente durante a compilação do Android para os assets via Gradle).
- **CI/CD (`.github/workflows/`)**: GitHub Actions para compilação automática do APK (`android.yml`), monitoramento upstream e releases.

---

## 2. REGRA MANDATÓRIA: Centralização de Versões e Atualizações

> [!IMPORTANT]
> **NUNCA** codifique versões de forma estática (hardcoded) em arquivos Java, Python, Gradle, HTML ou JavaScript.
> O arquivo central [`VERSION`](file:///d:/Programacao/tag-tracker/VERSION) na raiz do repositório é a **única fonte da verdade** para o versionamento do projeto.

### 2.1 Fonte Única da Verdade (`VERSION`)
- O arquivo `VERSION` na raiz do projeto contém apenas o número de versão no formato SemVer (ex.: `3.23.2`).
- **Nenhum outro arquivo deve definir a versão manualmente.**

### 2.2 Integração no Android Gradle (`android/app/build.gradle`)
O Gradle lê dinamicamente a versão da raiz do projeto:
```groovy
def verFile = file("${repoRoot}/VERSION")
def defaultVersion = verFile.exists() ? verFile.text.trim() : "3.23.2"
def defaultVersionCode = {
    try {
        def nums = defaultVersion.replaceAll(/[^0-9.]/, "").split("\\.")
        int c = 0
        for (int i = 0; i < nums.length && i < 3; i++) {
            c = c * 100 + Integer.parseInt(nums[i])
        }
        return c > 0 ? c : 3232
    } catch (Exception e) { return 3232 }
}()

android {
    buildFeatures {
        buildConfig true
    }
    defaultConfig {
        versionCode Integer.parseInt(System.getenv("VERSION_CODE") ?: "${defaultVersionCode}")
        versionName System.getenv("VERSION_NAME") ?: defaultVersion
    }
}
```
- O `buildFeatures { buildConfig true }` expõe `BuildConfig.VERSION_NAME` para o código Java nativo em tempo de compilação.
- O `versionCode` numérico é gerado deterministicamente (ex.: `3.23.2` $\rightarrow$ `32302`).

### 2.3 Checagem Nativa Android (`UpdateChecker.java`)
- O método `currentVersion(Activity a)` obtém a versão via `BuildConfig.VERSION_NAME`.
- Ao verificar atualizações no GitHub (`/repos/jamesonabade/tag-tracker/releases/latest`), compara a versão atual com a tag mais recente através de `isNewer(latestTag, currentVersion)`.
- Se a preferência `autoUpdate` estiver desativada pelo usuário (`TagApp.KEY_AUTO_UPDATE`), checagens silenciosas de inicialização são ignoradas.

### 2.4 Ponte Nativo $\rightarrow$ WebView (`SettingsActivity.java`)
- No Android, a tela de configurações injeta dinamicamente a versão no JSON de estado enviado para a WebView:
  ```java
  s.put("appVersion", UpdateChecker.currentVersion(this));
  ```

### 2.5 Servidor Backend (`server/app.py`)
- O servidor lê a versão de `ROOT / "VERSION"` e expõe o endpoint:
  ```python
  @app.get("/api/version")
  def api_version():
      return {"version": APP_VERSION}
  ```

### 2.6 Interface Web e Configurações (`web/settings.html`)
- A função `applyAppVersion(ver)` popula automaticamente todos os elementos da UI:
  - Título/Badge superior: `#appVersionText`
  - Badge de status de atualização: `#updateVersionBadge`
  - Rodapé de direitos autorais: `#footerVersionText`
- No modo Android: recebe a versão através do evento `updateState(jsonStr)`.
- No modo Navegador/Docker: consome `GET /api/version`.
- A checagem manual compara dinamicamente contra `currentState.appVersion`.

### 2.7 Checklist para Lançamento de Novas Versões
Ao preparar uma nova versão:
1. Atualize apenas o número no arquivo [`VERSION`](file:///d:/Programacao/tag-tracker/VERSION) (ex.: `3.24.0`).
2. Se houver novas funcionalidades ou correções, documente no `README.md`.
3. Valide a compilação local:
   ```cmd
   cd android && gradlew.bat :app:assembleRelease
   ```
4. Faça commit das alterações:
   ```sh
   git add VERSION README.md
   git commit -m "chore(release): bump versao para v3.24.0"
   ```
5. Crie a tag Git correspondente:
   ```sh
   git tag -a v3.24.0 -m "Release v3.24.0: resumo das mudancas"
   ```
6. O CI/CD do GitHub Actions compilará automaticamente o APK e associará a tag correspondente.

---

## 3. Fluxo de Git e Boas Práticas

- **Branches**:
  - `main`: Branch estável de produção. Apenas código testado e releases consolidadas.
  - `develop`: Branch de integração contínua para novas funcionalidades e correções em andamento.
  - Branches de feature ou fix: ramificadas de `develop` e mescladas via pull request ou merge fast-forward após validação.
- **Convenção de Commits**:
  - Padrão Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
  - Exemplos:
    - `feat(settings): adicionar controle de atualizacoes automaticas`
    - `fix(version): corrigir comparacao de versoes no update checker`
    - `docs(readme): atualizar guia de releases e versionamento`
- **Integridade do Histórico**:
  - Nunca reescreva histórico (`git push --force`) sem solicitação explícita do usuário.
  - Mantenha branches sincronizadas entre `origin/main` e `origin/develop`.

---

## 4. Segurança e Políticas de Licenciamento

- **Segredos e Chaves Privadas**:
  - **NUNCA** commite arquivos com credenciais, tokens, chaves privadas de criptografia ou keystores de produção (`data/google_secrets.json`, `.p12`, `.jks`, `.pem`, etc.).
  - Os diretórios `licenciador/` e `android/keygen/` foram purgados do histórico do repositório e **não devem ser recriados ou commitados**.
- **Validação de Licença**:
  - O código público de validação de licenças offline (`LicenseValidator.java`, `server/license.py`) deve ser rigorosamente mantido e preservado.
  - Qualquer alteração nas telas de configurações ou validação deve garantir compatibilidade com as licenças existentes (Free e Pro).

---

## 5. Ambiente de Compilação Android

- **Java Runtime**: Utilize o JDK/JBR compatível com Gradle 8.11+ e Android Gradle Plugin 8.7+ (ex.: `C:\Program Files\Android\Android Studio1\jbr`).
- **Comandos de Build**:
  - Compilação Debug: `gradlew.bat :app:assembleDebug`
  - Compilação Release: `gradlew.bat :app:assembleRelease`
- **Chaquopy & Shared Assets**:
  - A task `:app:copySharedCode` copia automaticamente os arquivos de `server/` e `web/` para os assets do Android antes da compilação.
  - Não edite arquivos dentro de `android/app/build/sharedCode/`; sempre edite os arquivos originais em `server/` e `web/`.

