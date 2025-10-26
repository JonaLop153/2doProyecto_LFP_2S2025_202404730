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
        
        // Análisis léxico
        const lexer = new JavaLexer(javaSource);
        const lexerResult = lexer.analyze();

        this.displayErrors(lexerResult.errors, 'léxicos');
        this.displayTokens(lexerResult.tokens);

        if (lexerResult.errors.length > 0) {
            this.pythonCode.value = "// Errores léxicos encontrados. Corrígelos para generar la traducción.";
            return;
        }

        // Análisis sintáctico
        const parser = new JavaParser(lexerResult.tokens);
        const parserResult = parser.parse();

        this.displayErrors(parserResult.errors, 'sintácticos');

        if (parserResult.errors.length > 0) {
            this.pythonCode.value = "// Errores sintácticos encontrados. Corrígelos para generar la traducción.";
            return;
        }

        // Traducción (próxima fase)
        this.pythonCode.value = "// Análisis exitoso - Traducción pendiente de implementar\n";
        this.pythonCode.value += "// AST generado correctamente";
        
        console.log("AST:", parserResult.ast); // Para debugging
    }

    showTokens() {
        const javaSource = this.javaCode.value;
        const lexer = new JavaLexer(javaSource);
        const result = lexer.analyze();
        
        this.displayTokens(result.tokens);
        this.displayErrors(result.errors, 'léxicos');
    }

    simulate() {
        alert("Simulación de ejecución - Pendiente de implementar");
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