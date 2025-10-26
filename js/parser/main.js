// js/parser/main.js
class JavaParser extends StatementParser {
    parseProgram() {
        console.log("🔍 parseProgram() - Token actual:", this.currentToken);
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        // 'public' 'class' ID
        if (!this.match('PALABRA_RESERVADA', 'public')) {
            this.addError("Se esperaba 'public'", startLine, startColumn);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'class')) {
            this.addError("Se esperaba 'class'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const className = this.expect('IDENTIFICADOR');
        if (!className) return null;

        // '{'
        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        // MAIN
        console.log("🔍 Llamando a parseMain()...");
        const mainNode = this.parseMain();
        if (!mainNode) {
            console.log("❌ parseMain() falló");
            return null;
        }
        console.log("✓ parseMain() exitoso");

        // '}'
        console.log("Token actual antes de verificación final:", this.currentToken);
        if (this.currentToken.lexeme === '}') {
            console.log("✓ Encontrado '}' final de la clase");
            this.advance();
        } else if (this.currentToken.type !== 'EOF') {
            console.log(`⚠️  Token extra al final: '${this.currentToken.lexeme}', pero la estructura está completa`);
            this.advance();
        }

        this.ast = {
            type: 'PROGRAM',
            className: className.lexeme,
            main: mainNode,
            line: startLine,
            column: startColumn
        };

        console.log("🎉 parseProgram() COMPLETADO EXITOSAMENTE");
        return this.ast;
    }

    parseMain() {
        console.log("🔍 parseMain() - Token actual:", this.currentToken);
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        // 'public' 'static' 'void' 'main'
        if (!this.match('PALABRA_RESERVADA', 'public') ||
            !this.match('PALABRA_RESERVADA', 'static') ||
            !this.match('PALABRA_RESERVADA', 'void') ||
            !this.match('PALABRA_RESERVADA', 'main') ||
            !this.match('SIMBOLO', '(') ||
            !this.match('PALABRA_RESERVADA', 'String') ||
            !this.match('SIMBOLO', '[') ||
            !this.match('SIMBOLO', ']')) {
            return null;
        }

        let argsName = 'args';
        if (this.currentToken.type === 'IDENTIFICADOR') {
            argsName = this.currentToken.lexeme;
            this.advance();
        }

        if (!this.match('SIMBOLO', ')') ||
            !this.match('SIMBOLO', '{')) {
            return null;
        }

        const statements = this.parseStatements();
        console.log("✓ parseStatements() completado. Statements:", statements.length);

        if (this.currentToken.lexeme === '}') {
            console.log("✓ Encontrado '}' del main");
            this.advance();
        }

        console.log("🎉 parseMain() COMPLETADO EXITOSAMENTE");
        return {
            type: 'MAIN',
            argsName: argsName,
            statements: statements,
            line: startLine,
            column: startColumn
        };
    }

    parse() {
        console.log("=== INICIANDO PARSER ===");
        console.log("Tokens recibidos:", this.tokens.length);
        
        try {
            this.ast = this.parseProgram();
            
            if (this.ast) {
                console.log("✓ parseProgram() exitoso");
            } else {
                console.log("✗ parseProgram() retornó null");
            }
        } catch (error) {
            console.error("❌ ERROR en parseProgram():", error);
        }
        
        console.log("=== PARSER COMPLETADO ===");
        console.log("AST:", this.ast);
        console.log("Errores:", this.errors);
        
        return {
            ast: this.ast,
            errors: this.errors
        };
    }
}