// js/app.js (actualizado)
class JavaBridgeApp {
    constructor() {
        this.javaCode = document.getElementById('javaCode');
        this.pythonCode = document.getElementById('pythonCode');
        this.translateBtn = document.getElementById('translateBtn');
        this.tokensBtn = document.getElementById('tokensBtn');
        this.simulateBtn = document.getElementById('simulateBtn');
        this.tokensReport = document.getElementById('tokensReport');
        this.errorsReport = document.getElementById('errorsReport');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.translateBtn.addEventListener('click', () => this.translate());
        this.tokensBtn.addEventListener('click', () => this.showTokens());
        this.simulateBtn.addEventListener('click', () => this.simulate());
    }

  translate() {
    const javaSource = this.javaCode.value;
    console.log("=== INICIANDO TRADUCCIÓN ===");
    console.log("Código Java:", javaSource);
    
    // Análisis léxico
     console.log("1. Análisis léxico...");
    const lexer = new JavaLexer(javaSource);
    const lexerResult = lexer.analyze();

    console.log("=== TOKENS GENERADOS ===");
    lexerResult.tokens.forEach((token, index) => {
        console.log(`${index}: '${token.lexeme}' (${token.type})`);
    });
    console.log("=========================");
    console.log("Errores léxicos:", lexerResult.errors);

    this.displayErrors(lexerResult.errors, 'léxicos');
    this.displayTokens(lexerResult.tokens);

    if (lexerResult.errors.length > 0) {
        this.pythonCode.value = "# Errores léxicos encontrados. Corrígelos para generar la traducción.";
        return;
    }

    // Análisis sintáctico
    console.log("2. Análisis sintáctico...");
    const parser = new JavaParser(lexerResult.tokens); // ← Usar el nuevo parser
    const parserResult = parser.parse();
    console.log("Parser completado. AST:", parserResult.ast ? "Sí" : "No", "Errores:", parserResult.errors.length);

    this.displayErrors(parserResult.errors, 'sintácticos');

    if (parserResult.errors.length > 0) {
        this.pythonCode.value = "# Errores sintácticos encontrados. Corrígelos para generar la traducción.";
        return;
    }

    // TRADUCCIÓN
    console.log("3. Traducción...");
    const translator = new JavaToPythonTranslator();
    const pythonCode = translator.translate(parserResult.ast);
    console.log("Traducción completada");
    
    this.pythonCode.value = pythonCode;
    
    console.log("=== TRADUCCIÓN COMPLETADA ===");
}

    showTokens() {
        const javaSource = this.javaCode.value;
        const lexer = new JavaLexer(javaSource);
        const result = lexer.analyze();
        
        this.displayTokens(result.tokens);
        this.displayErrors(result.errors, 'léxicos');
    }

    simulate() {
        // Por ahora solo muestra el código Python
        alert("Simulación de ejecución - En desarrollo\nPor ahora puedes copiar el código Python y ejecutarlo localmente.");
    }

    displayTokens(tokens) {
        if (tokens.length === 0) {
            this.tokensReport.innerHTML = '<p>No hay tokens para mostrar</p>';
            return;
        }

        let html = '<h3>Reporte de Tokens</h3>';
        html += '<table>';
        html += '<tr><th>No.</th><th>Lexema</th><th>Tipo</th><th>Línea</th><th>Columna</th></tr>';
        
        tokens.forEach((token, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(token.lexeme)}</td>
                <td>${token.type}</td>
                <td>${token.line}</td>
                <td>${token.column}</td>
            </tr>`;
        });
        
        html += '</table>';
        this.tokensReport.innerHTML = html;
    }

    displayErrors(errors, type = 'léxicos') {
        if (errors.length === 0) {
            this.errorsReport.innerHTML = `<p style="color: green;">No hay errores ${type}</p>`;
            return;
        }

        let html = `<h3 style="color: red;">Errores ${type}</h3>`;
        html += '<table>';
        html += '<tr><th>No.</th><th>Error</th><th>Descripción</th><th>Línea</th><th>Columna</th></tr>';
        
        errors.forEach((error, index) => {
            html += `<tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(error.message)}</td>
                <td>Error ${type}</td>
                <td>${error.line}</td>
                <td>${error.column}</td>
            </tr>`;
        });
        
        html += '</table>';
        this.errorsReport.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar la aplicación cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    new JavaBridgeApp();
});