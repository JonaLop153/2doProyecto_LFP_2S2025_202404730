// js/parser/ParserCore.js
class ParserCore {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.currentToken = null;
        this.errors = [];
        this.ast = null;
        
        this.advance();
    }

    advance() {
        if (this.position < this.tokens.length) {
            this.currentToken = this.tokens[this.position];
            this.position++;
            console.log(`🔄 ADVANCE: '${this.currentToken.lexeme}' (${this.position-1}/${this.tokens.length})`);
        } else {
            this.currentToken = { 
                type: 'EOF', 
                lexeme: 'EOF',
                line: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].line : 1,
                column: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].column + 1 : 1
            };
            console.log(`🔄 ADVANCE: EOF (fin de tokens)`);
        }
        return this.currentToken;
    }

    peek(offset = 0) {
        const index = this.position + offset;
        if (index < this.tokens.length) {
            return this.tokens[index];
        }
        return { type: 'EOF', lexeme: 'EOF', line: -1, column: -1 };
    }

    match(expectedType, expectedLexeme = null) {
        if (this.currentToken.type === expectedType && 
            (!expectedLexeme || this.currentToken.lexeme === expectedLexeme)) {
            const token = this.currentToken;
            this.advance();
            return token;
        }
        return null;
    }

    expect(expectedType, expectedLexeme = null) {
        const token = this.match(expectedType, expectedLexeme);
        if (!token) {
            const expected = expectedLexeme || expectedType;
            this.addError(`Se esperaba '${expected}'`, this.currentToken.line, this.currentToken.column);
            return null;
        }
        return token;
    }

    addError(message, line, column) {
        const errorLine = line > 0 ? line : 1;
        const errorColumn = column > 0 ? column : 1;
        
        this.errors.push({
            message: message,
            line: errorLine,
            column: errorColumn
        });
    }

    synchronize() {
        console.log("🔄 Sincronizando...");
        let safetyCounter = 0;
        const MAX_SAFETY = 100;
        
        while (this.currentToken.type !== 'EOF' && safetyCounter < MAX_SAFETY) {
            safetyCounter++;
            
            console.log(`Sincronizando: saltando '${this.currentToken.lexeme}'`);
            
            if (this.currentToken.lexeme === ';' || 
                this.currentToken.lexeme === '}' ||
                this.peek().lexeme === 'int' || this.peek().lexeme === 'double' ||
                this.peek().lexeme === 'char' || this.peek().lexeme === 'String' ||
                this.peek().lexeme === 'boolean' || this.peek().lexeme === 'if' ||
                this.peek().lexeme === 'for' || this.peek().lexeme === 'while' ||
                this.peek().lexeme === 'System') {
                console.log("✅ Punto de sincronización encontrado");
                return;
            }
            this.advance();
        }
        
        if (safetyCounter >= MAX_SAFETY) {
            console.log("⚠️  Límite de seguridad alcanzado en sincronización");
        }
    }
}