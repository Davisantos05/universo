# Nosso Universo 3D - Davi & Stella 💖

Inspirado no projeto viral do TikTok (@alexx.dev). Um universo interativo 3D com buraco negro, coração de partículas pulsante, fotos e recadinhos orbitando em tempo real.

---

## 🚀 Como Abrir e Testar no VS Code

1. Abra a pasta do projeto no **VS Code**.
2. Instale a extensão **Live Server** (caso ainda não tenha).
3. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
4. O navegador abrirá automaticamente em `http://127.0.0.1:5500`.

> **Por que usar o Live Server?**  
> Navegadores bloqueiam o carregamento de texturas e áudios locais por questões de segurança (CORS) quando você clica duas vezes no arquivo HTML direto. O Live Server resolve isso instantaneamente.

---

## 🎨 Como Personalizar

### 1. Colocar suas Fotos Reais
Na pasta `assets/`:
- Substitua `foto1.jpg`, `foto2.jpg`, `foto3.jpg`, `foto4.jpg` pelas fotos de vocês.
- O formato recomendado é quadrado ou proporção 4:5.

### 2. Colocar a Música do Casal
- Coloque o arquivo de áudio na pasta `assets/` com o nome exato: `musica.mp3`.
- Se você não colocar a música agora, o site possui uma trilha sonora ambiente romântica automática via Web Audio API para nunca ficar no silêncio!

### 3. Personalizar Frases e Mensagens
Abra o arquivo `script.js` e edite a lista `MEMORIAS`:
- Você pode alterar os títulos, descrições e datas de cada card que orbita o coração.
