// js/lexer.js
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
    // 'args' REMOVED - no es palabra reservada
]);
        
        // Símbolos
       this.symbols = new Set([
    '{', '}', '(', ')', '[', ']', ';', ',', '=', '+', '-', '*', '/',
    '==', '!=', '>', '<', '>=', '<=', '++', '--', '.'  // ← Agregar el punto aquí
]);
    }

    // Método principal para analizar
    analyze() {
        this.tokens = [];
        this.errors = [];
        this.position = 0;
        this.line = 1;
        this.column = 1;

        while (this.position < this.sourceCode.length) {
            const char = this.sourceCode[this.position];
            
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
                this.addError(`Carácter no reconocido: '${char}'`);
                this.position++;
                this.column++;
            }
        }

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

        while (this.position < this.sourceCode.length && 
               (this.isLetter(this.sourceCode[this.position]) || 
                this.isDigit(this.sourceCode[this.position]) ||
                this.sourceCode[this.position] === '_')) {
            this.position++;
            this.column++;
        }

        const lexeme = this.sourceCode.substring(start, this.position);
        
        let type;
        if (this.keywords.has(lexeme)) {
            type = 'PALABRA_RESERVADA';
        } else {
            type = 'IDENTIFICADOR';
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

        while (this.position < this.sourceCode.length && 
               (this.isDigit(this.sourceCode[this.position]) || 
                this.sourceCode[this.position] === '.')) {
            
            if (this.sourceCode[this.position] === '.') {
                if (hasDecimal) {
                    isValid = false; // Múltiples puntos decimales
                }
                hasDecimal = true;
            }
            
            this.position++;
            this.column++;
        }

        const lexeme = this.sourceCode.substring(start, this.position);
        
        if (!isValid) {
            this.addError(`Número decimal inválido: '${lexeme}'`, startLine, startColumn);
        } else {
            const type = hasDecimal ? 'DECIMAL' : 'ENTERO';
            this.addToken(lexeme, type, startLine, startColumn);
        }
    }

    // AFD para cadenas
    readString() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        
        this.position++; // Saltar la comilla inicial
        this.column++;

        while (this.position < this.sourceCode.length && 
               this.sourceCode[this.position] !== '"') {
            
            if (this.sourceCode[this.position] === '\n') {
                this.addError('Cadena sin cerrar', startLine, startColumn);
                return;
            }
            
            this.position++;
            this.column++;
        }

        if (this.position >= this.sourceCode.length) {
            this.addError('Cadena sin cerrar', startLine, startColumn);
            return;
        }

        this.position++; // Saltar la comilla final
        this.column++;

        const lexeme = this.sourceCode.substring(start, this.position);
        this.addToken(lexeme, 'CADENA', startLine, startColumn);
    }

    // AFD para caracteres
    readChar() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        
        this.position++; // Saltar la comilla inicial
        this.column++;

        if (this.position >= this.sourceCode.length) {
            this.addError('Carácter mal formado', startLine, startColumn);
            return;
        }

        // Leer el carácter
        this.position++;
        this.column++;

        if (this.position >= this.sourceCode.length || 
            this.sourceCode[this.position] !== "'") {
            this.addError('Carácter mal formado', startLine, startColumn);
            return;
        }

        this.position++; // Saltar la comilla final
        this.column++;

        const lexeme = this.sourceCode.substring(start, this.position);
        this.addToken(lexeme, 'CARACTER', startLine, startColumn);
    }

    // AFD para comentarios
    readComment() {
        const startLine = this.line;
        const startColumn = this.column;
        
        this.position++; // Saltar el primer '/'
        this.column++;

        if (this.position >= this.sourceCode.length) {
            this.addToken('/', 'SIMBOLO', startLine, startColumn);
            return;
        }

        const nextChar = this.sourceCode[this.position];
        
        if (nextChar === '/') {
            // Comentario de línea
            this.readLineComment();
        } else if (nextChar === '*') {
            // Comentario de bloque
            this.readBlockComment();
        } else {
            // Es el operador división
            this.addToken('/', 'SIMBOLO', startLine, startColumn);
        }
    }

    // js/lexer.js - Actualizar el método readLineComment()
readLineComment() {
    const start = this.position - 1; // Incluye el primer '/'
    const startLine = this.line;
    const startColumn = this.column - 1;

    // Solo avanzar hasta el siguiente salto de línea
    while (this.position < this.sourceCode.length && 
           this.sourceCode[this.position] !== '\n') {
        this.position++;
        this.column++;
    }

    const lexeme = this.sourceCode.substring(start, this.position);
    this.addToken(lexeme, 'COMENTARIO_LINEA', startLine, startColumn);
    
}

    readBlockComment() {
        const start = this.position - 1; // Incluye el primer '/'
        const startLine = this.line;
        const startColumn = this.column - 1;

        this.position++; // Saltar el '*'
        this.column++;

        while (this.position < this.sourceCode.length - 1) {
            if (this.sourceCode[this.position] === '*' && 
                this.sourceCode[this.position + 1] === '/') {
                this.position += 2; // Saltar '*/'
                this.column += 2;
                
                const lexeme = this.sourceCode.substring(start, this.position);
                this.addToken(lexeme, 'COMENTARIO_BLOQUE', startLine, startColumn);
                return;
            }

            if (this.sourceCode[this.position] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            
            this.position++;
        }

        this.addError('Comentario de bloque sin cerrar', startLine, startColumn);
    }

    // AFD para símbolos
   readSymbol() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    const char = this.sourceCode[this.position];
    
    // Verificar símbolos de dos caracteres primero
    if (this.position + 1 < this.sourceCode.length) {
        const nextChar = this.sourceCode[this.position + 1];
        const twoCharSymbol = char + nextChar;
        
        if (this.symbols.has(twoCharSymbol)) {
            this.position += 2;
            this.column += 2;
            this.addToken(twoCharSymbol, 'SIMBOLO', startLine, startColumn);
            return;
        }
    }

    // Verificar símbolos de un carácter
    if (this.symbols.has(char)) {
        this.position++;
        this.column++;
        this.addToken(char, 'SIMBOLO', startLine, startColumn);
        return;
    }

    // Si no es un símbolo reconocido, es error
    this.addError(`Carácter no reconocido: '${char}'`, startLine, startColumn);
    this.position++;
    this.column++;
}
    // Métodos auxiliares
    isWhitespace(char) {
        return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }

    skipWhitespace() {
        while (this.position < this.sourceCode.length && 
               this.isWhitespace(this.sourceCode[this.position])) {
            if (this.sourceCode[this.position] === '\n') {
                this.line++;
                this.column = 1;
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
               ['=', '!', '>', '<', '+', '-'].includes(char); // Para símbolos compuestos
    }

    addToken(lexeme, type, line, column) {
        this.tokens.push({
            lexeme: lexeme,
            type: type,
            line: line,
            column: column
        });
    }

    addError(message, line = this.line, column = this.column) {
        this.errors.push({
            message: message,
            line: line,
            column: column
        });
    }
}