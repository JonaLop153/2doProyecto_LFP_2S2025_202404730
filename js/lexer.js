// js/lexer.js - LEXER COMPLETO Y CORREGIDO
class JavaLexer {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.errors = [];
        
        // Palabras reservadas
        this.keywords = new Set([
            'public', 'class', 'static', 'void', 'main', 'String',
            'int', 'double', 'char', 'boolean', 'true', 'false', 
            'if', 'else', 'for', 'while', 'System', 'out', 'println'
        ]);
        
        // Símbolos
        this.symbols = new Set([
            '{', '}', '(', ')', '[', ']', ';', ',', '=', '+', '-', '*', '/',
            '==', '!=', '>', '<', '>=', '<=', '++', '--', '.'
        ]);

        console.log("✅ Lexer inicializado");
    }

    // Método principal para analizar
    analyze() {
        this.tokens = [];
        this.errors = [];
        this.position = 0;
        this.line = 1;
        this.column = 1;

        console.log("🔍 LEXER: Analizando código...");
        console.log("Código fuente:", JSON.stringify(this.sourceCode));

        while (this.position < this.sourceCode.length) {
            const char = this.sourceCode[this.position];
            const startPos = this.position;
            
            console.log(`Procesando carácter: '${char}' (posición ${this.position}, línea ${this.line}, columna ${this.column})`);

            if (this.isWhitespace(char)) {
                this.skipWhitespace();
            } else if (this.isLetter(char) || char === '_') {
                this.readIdentifier();
            } else if (this.isDigit(char)) {
                this.readNumber();
            } else if (char === '"') {
                this.readString();
            } else if (char === "'") {
                this.readChar();
            } else if (char === '/') {
                this.readComment();
            } else if (this.isSymbol(char)) {
                this.readSymbol();
            } else {
                console.log(`❌ Carácter no reconocido: '${char}' (ASCII: ${char.charCodeAt(0)})`);
                this.addError(`Carácter no reconocido: '${char}'`, this.line, this.column);
                this.position++;
                this.column++;
            }

            // Verificar que avanzamos para evitar loop infinito
            if (this.position === startPos) {
                console.log("⚠️  El lexer no avanzó, forzando avance...");
                this.position++;
                this.column++;
            }
        }

        console.log("✅ LEXER: Completado. Tokens:", this.tokens.length, "Errores:", this.errors.length);
        console.log("Tokens:", this.tokens);
        console.log("Errores:", this.errors);
        
        return {
            tokens: this.tokens,
            errors: this.errors
        };
    }

    // AFD para identificadores
    readIdentifier() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;

        console.log(`📖 Leyendo identificador desde posición ${start}`);

        while (this.position < this.sourceCode.length && 
               (this.isLetter(this.sourceCode[this.position]) || 
                this.isDigit(this.sourceCode[this.position]) ||
                this.sourceCode[this.position] === '_')) {
            this.position++;
            this.column++;
        }

        const lexeme = this.sourceCode.substring(start, this.position);
        console.log(`📖 Identificador encontrado: '${lexeme}'`);
        
        let type;
        if (this.keywords.has(lexeme)) {
            type = 'PALABRA_RESERVADA';
            console.log(`   → Es palabra reservada`);
        } else {
            type = 'IDENTIFICADOR';
            console.log(`   → Es identificador`);
        }

        this.addToken(lexeme, type, startLine, startColumn);
    }

    // AFD para números
    readNumber() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        let hasDecimal = false;
        let isValid = true;

        console.log(`🔢 Leyendo número desde posición ${start}`);

        while (this.position < this.sourceCode.length && 
               (this.isDigit(this.sourceCode[this.position]) || 
                this.sourceCode[this.position] === '.')) {
            
            if (this.sourceCode[this.position] === '.') {
                if (hasDecimal) {
                    isValid = false; // Múltiples puntos decimales
                    console.log("❌ Número con múltiples puntos decimales");
                }
                hasDecimal = true;
            }
            
            this.position++;
            this.column++;
        }

        const lexeme = this.sourceCode.substring(start, this.position);
        console.log(`🔢 Número encontrado: '${lexeme}'`);
        
        if (!isValid) {
            this.addError(`Número decimal inválido: '${lexeme}'`, startLine, startColumn);
        } else {
            const type = hasDecimal ? 'DECIMAL' : 'ENTERO';
            console.log(`   → Tipo: ${type}`);
            this.addToken(lexeme, type, startLine, startColumn);
        }
    }

    // AFD para cadenas
    readString() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        
        console.log(`📝 Leyendo cadena desde posición ${start}`);
        
        this.position++; // Saltar la comilla inicial
        this.column++;

        while (this.position < this.sourceCode.length && 
               this.sourceCode[this.position] !== '"') {
            
            if (this.sourceCode[this.position] === '\n') {
                this.addError('Cadena sin cerrar', startLine, startColumn);
                console.log("❌ Cadena sin cerrar (salto de línea encontrado)");
                return;
            }
            
            this.position++;
            this.column++;
        }

        if (this.position >= this.sourceCode.length) {
            this.addError('Cadena sin cerrar', startLine, startColumn);
            console.log("❌ Cadena sin cerrar (fin de archivo)");
            return;
        }

        this.position++; // Saltar la comilla final
        this.column++;

        const lexeme = this.sourceCode.substring(start, this.position);
        console.log(`📝 Cadena encontrada: ${lexeme}`);
        this.addToken(lexeme, 'CADENA', startLine, startColumn);
    }

    // AFD para caracteres
    readChar() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        
        console.log(`🔤 Leyendo carácter desde posición ${start}`);
        
        this.position++; // Saltar la comilla inicial
        this.column++;

        if (this.position >= this.sourceCode.length) {
            this.addError('Carácter mal formado', startLine, startColumn);
            console.log("❌ Carácter mal formado (fin de archivo)");
            return;
        }

        // Leer el carácter
        this.position++;
        this.column++;

        if (this.position >= this.sourceCode.length || 
            this.sourceCode[this.position] !== "'") {
            this.addError('Carácter mal formado', startLine, startColumn);
            console.log("❌ Carácter mal formado (falta comilla final)");
            return;
        }

        this.position++; // Saltar la comilla final
        this.column++;

        const lexeme = this.sourceCode.substring(start, this.position);
        console.log(`🔤 Carácter encontrado: ${lexeme}`);
        this.addToken(lexeme, 'CARACTER', startLine, startColumn);
    }

    // AFD para comentarios
    readComment() {
        const startLine = this.line;
        const startColumn = this.column;
        
        console.log(`💬 Leyendo comentario desde posición ${this.position}`);
        
        this.position++; // Saltar el primer '/'
        this.column++;

        if (this.position >= this.sourceCode.length) {
            this.addToken('/', 'SIMBOLO', startLine, startColumn);
            return;
        }

        const nextChar = this.sourceCode[this.position];
        
        if (nextChar === '/') {
            console.log("   → Comentario de línea");
            this.readLineComment();
        } else if (nextChar === '*') {
            console.log("   → Comentario de bloque");
            this.readBlockComment();
        } else {
            console.log("   → Operador división");
            this.addToken('/', 'SIMBOLO', startLine, startColumn);
        }
    }

    readLineComment() {
        const start = this.position - 1; // Incluye el primer '/'
        const startLine = this.line;
        const startColumn = this.column - 1;

        while (this.position < this.sourceCode.length && 
               this.sourceCode[this.position] !== '\n') {
            this.position++;
            this.column++;
        }

        const lexeme = this.sourceCode.substring(start, this.position);
        console.log(`💬 Comentario de línea: ${lexeme}`);
        this.addToken(lexeme, 'COMENTARIO_LINEA', startLine, startColumn);
    }

    readBlockComment() {
        const start = this.position - 1; // Incluye el primer '/'
        const startLine = this.line;
        const startColumn = this.column - 1;

        this.position++; // Saltar el '*'
        this.column++;

        let commentClosed = false;
        while (this.position < this.sourceCode.length - 1) {
            if (this.sourceCode[this.position] === '*' && 
                this.sourceCode[this.position + 1] === '/') {
                this.position += 2; // Saltar '*/'
                this.column += 2;
                commentClosed = true;
                break;
            }

            if (this.sourceCode[this.position] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            
            this.position++;
        }

        if (!commentClosed) {
            this.addError('Comentario de bloque sin cerrar', startLine, startColumn);
            console.log("❌ Comentario de bloque sin cerrar");
            return;
        }

        const lexeme = this.sourceCode.substring(start, this.position);
        console.log(`💬 Comentario de bloque: ${lexeme.substring(0, 50)}...`);
        this.addToken(lexeme, 'COMENTARIO_BLOQUE', startLine, startColumn);
    }

    // AFD para símbolos
    readSymbol() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;

        const char = this.sourceCode[this.position];
        console.log(`🔣 Procesando símbolo: '${char}' en posición ${start}`);
        
        // Verificar símbolos de dos caracteres primero
        if (this.position + 1 < this.sourceCode.length) {
            const nextChar = this.sourceCode[this.position + 1];
            const twoCharSymbol = char + nextChar;
            
            console.log(`   → Probando símbolo de 2 chars: '${twoCharSymbol}'`);
            
            if (this.symbols.has(twoCharSymbol)) {
                this.position += 2;
                this.column += 2;
                console.log(`   → Símbolo de 2 caracteres encontrado: '${twoCharSymbol}'`);
                this.addToken(twoCharSymbol, 'SIMBOLO', startLine, startColumn);
                return;
            }
        }

        // Verificar símbolos de un carácter
        console.log(`   → Probando símbolo de 1 char: '${char}'`);
        if (this.symbols.has(char)) {
            this.position++;
            this.column++;
            console.log(`   → Símbolo de 1 carácter encontrado: '${char}'`);
            this.addToken(char, 'SIMBOLO', startLine, startColumn);
            return;
        }

        // Si no es un símbolo reconocido, es error
        console.log(`❌ Símbolo no reconocido: '${char}'`);
        this.addError(`Carácter no reconocido: '${char}'`, startLine, startColumn);
        this.position++;
        this.column++;
    }

    // Métodos auxiliares
    isWhitespace(char) {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }

    skipWhitespace() {
        console.log(`   ␣ Saltando whitespace...`);
        while (this.position < this.sourceCode.length && 
               this.isWhitespace(this.sourceCode[this.position])) {
            if (this.sourceCode[this.position] === '\n') {
                this.line++;
                this.column = 1;
                console.log(`     ↳ Salto de línea, nueva línea: ${this.line}`);
            } else {
                this.column++;
            }
            this.position++;
        }
    }

    isLetter(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    isSymbol(char) {
        return this.symbols.has(char) || 
               ['=', '!', '>', '<', '+', '-'].includes(char);
    }

    addToken(lexeme, type, line, column) {
        const token = {
            lexeme: lexeme,
            type: type,
            line: line,
            column: column
        };
        this.tokens.push(token);
        console.log(`   ✅ Token agregado: {lexeme: '${lexeme}', type: '${type}', line: ${line}, column: ${column}}`);
    }

    addError(message, line = this.line, column = this.column) {
        const error = {
            message: message,
            line: line,
            column: column
        };
        this.errors.push(error);
        console.log(`   ❌ Error agregado:`, error);
    }
}