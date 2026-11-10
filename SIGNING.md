# Assinatura e atualizações do Tag Tracker

## Fonte única de versão

O arquivo `VERSION` define `versionName` e `versionCode` no Android Studio e no GitHub Actions.
Exemplo: `3.23.3` produz `versionName=3.23.3` e `versionCode=32303`.
O atualizador do aplicativo compara a versão instalada com a última GitHub Release publicada.
Artifacts de builds de teste não são releases e não devem ser oferecidos como atualizações.

## Assinatura oficial

A identidade de assinatura é uma chave privada PKCS12 permanente, não uma chave nova por build.
Se perder a chave e as senhas, não será possível atualizar instalações existentes com a mesma identidade.
Guarde backup seguro **fora do GitHub e fora do repositório público**.

### GitHub Actions

Cadastre em Settings > Secrets and variables > Actions os secrets:

- `ANDROID_KEYSTORE_BASE64`: arquivo PKCS12 completo codificado em Base64
- `ANDROID_KEYSTORE_PASSWORD`: senha do keystore
- `ANDROID_KEY_ALIAS`: alias da chave
- `ANDROID_KEY_PASSWORD`: senha da chave

O workflow interrompe builds em TODAS as branches quando falta qualquer secret; não usa assinatura Debug temporária.\nO certificado oficial possui SHA-256: 19:78:C8:0B:E9:E8:6C:3C:8B:B3:4B:12:D8:AC:FF:4D:2C:6D:FB:2E:69:49:62:5D:35:E4:D2:2C:5F:92:D2:2B\nO workflow exige exatamente esse certificado para impedir troca de chave acidental.

### Android Studio

Transfira a MESMA chave privada, por um canal seguro, ao computador e coloque-a em uma pasta privada.
Crie o arquivo não versionado `android/signing.properties`:

```properties
storeFile=C:/caminho/seguro/tagtracker-release.p12
storePassword=MINHA_SENHA_PRIVADA
keyAlias=tagtracker
keyPassword=MINHA_SENHA_PRIVADA
```

Use barras `/` para caminhos Windows. Esse arquivo é ignorado pelo `.gitignore`.
Com ele configurado, o Gradle utiliza a identidade oficial inclusive quando você clica em Run para Debug.
Sem esse arquivo, o Debug utiliza a chave padrão do Android Studio e NÃO será compatível com a Release.

**Git não sincroniza segredos do GitHub Actions**. É necessário transferir a chave ao Android Studio uma vez.

## Publicação

Para criar uma nova release oficial, altere `VERSION`, integre as alterações em `main`,
e publique a tag `v` + VERSION (por exemplo `v3.23.3`) no commit correspondente.
Todos os pushes em qualquer branch geram um APK Release assinado, mas somente tags publicam Releases.\nO GitHub Actions verifica se a tag coincide com a versão e se o commit pertence à main.
Somente uma APK Release assinada com a chave permanente deve ser oferecida no GitHub Releases.

## Antes de desinstalar a versão Debug antiga

Um APK assinado por chave diferente não atualiza a instalação atual sem desinstalação.
O backup do Google Drive contém localizações em CSV, não necessariamente dados de login Google,
chaves de desbloqueio da conta, a licença ou configurações. Guarde-os separadamente.

Não desinstale antes de existir uma APK oficial assinada, disponível para download,
e de confirmar que será possível restabelecer o login e importar o histórico.
