// js/parser.js
class JavaParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.currentToken = null;
        this.errors = [];
        this.ast = null;
        
        this.advance();
    }

    // Métodos básicos del parser
    advance() {
        if (this.position < this.tokens.length) {
            this.currentToken = this.tokens[this.position];
            this.position++;
        } else {
            this.currentToken = { type: 'EOF', lexeme: '', line: -1, column: -1 };
        }
        return this.currentToken;
    }

    peek(offset = 0) {
        const index = this.position + offset;
        if (index < this.tokens.length) {
            return this.tokens[index];
        }
        return { type: 'EOF', lexeme: '', line: -1, column: -1 };
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
        this.errors.push({
            message: message,
            line: line,
            column: column
        });
    }

    // Gramática: PROGRAMA ::= 'public' 'class' ID '{' MAIN '}'
    parseProgram() {
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
        const mainNode = this.parseMain();
        if (!mainNode) return null;

        // '}'
        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        // Verificar que no hay tokens extra
        if (this.currentToken.type !== 'EOF') {
            this.addError("Código extra después del cierre de la clase", 
                         this.currentToken.line, this.currentToken.column);
        }

        this.ast = {
            type: 'PROGRAM',
            className: className.lexeme,
            main: mainNode,
            line: startLine,
            column: startColumn
        };

        return this.ast;
    }

    // MAIN ::= 'public' 'static' 'void' 'main' '(' 'String' '[' ']' ID ')' '{' SENTENCIAS '}'
    parseMain() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        // 'public' 'static' 'void' 'main'
        if (!this.match('PALABRA_RESERVADA', 'public')) {
            this.addError("Se esperaba 'public'", startLine, startColumn);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'static')) {
            this.addError("Se esperaba 'static'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'void')) {
            this.addError("Se esperaba 'void'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'main')) {
            this.addError("Se esperaba 'main'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        // '(' 'String' '[' ']' ID ')'
        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'String')) {
            this.addError("Se esperaba 'String'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '[')) {
            this.addError("Se esperaba '['", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', ']')) {
            this.addError("Se esperaba ']'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const argsName = this.expect('IDENTIFICADOR');
        if (!argsName) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        // '{' SENTENCIAS '}'
        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const statements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        return {
            type: 'MAIN',
            argsName: argsName.lexeme,
            statements: statements,
            line: startLine,
            column: startColumn
        };
    }

    // SENTENCIAS ::= SENTENCIA SENTENCIAS | ε
    parseStatements() {
        const statements = [];

        while (this.currentToken.type !== 'EOF' && 
               this.currentToken.lexeme !== '}') {
            
            const statement = this.parseStatement();
            if (statement) {
                statements.push(statement);
            } else {
                // Error recovery: saltar hasta el siguiente punto y coma o llave de cierre
                this.synchronize();
            }
        }

        return statements;
    }

    // SENTENCIA ::= DECLARACION | ASIGNACION | IF | FOR | WHILE | PRINT | ';'
   parseStatement() {
    const token = this.currentToken;
    console.log(`parseStatement: Token actual = '${token.lexeme}' (${token.type})`); // DEBUG

    if (token.lexeme === ';') {
        console.log("  -> Declaración vacía"); // DEBUG
        this.advance();
        return { type: 'EMPTY_STATEMENT' };
    }

    switch (token.lexeme) {
        case 'int':
        case 'double':
        case 'char':
        case 'String':
        case 'boolean':
            console.log("  -> Parseando declaración"); // DEBUG
            return this.parseDeclaration();
        case 'if':
            return this.parseIf();
        case 'for':
            return this.parseFor();
        case 'while':
            return this.parseWhile();
        case 'System':
            return this.parsePrint();
        default:
            if (token.type === 'IDENTIFICADOR') {
                const nextToken = this.peek();
                console.log(`  -> Siguiente token = '${nextToken.lexeme}'`); // DEBUG
                if (nextToken.lexeme === '=') {
                    console.log("  -> Parseando asignación"); // DEBUG
                    return this.parseAssignment();
                }
            }
            console.log(`  -> ERROR: Sentencia no reconocida: '${token.lexeme}'`); // DEBUG
            this.addError(`Sentencia no reconocida: '${token.lexeme}'`, 
                         token.line, token.column);
            return null;
    }
}

    // DECLARACION ::= TIPO LISTA_VARS ';'
   parseDeclaration() {
    const startLine = this.currentToken.line;
    const startColumn = this.currentToken.column;
    console.log(`parseDeclaration: Tipo = '${this.currentToken.lexeme}'`); // DEBUG

    const typeToken = this.expect('PALABRA_RESERVADA');
    if (!typeToken) return null;

    const variables = this.parseVariableList();
    if (!variables) return null;

    console.log(`parseDeclaration: Esperando ';', token actual = '${this.currentToken.lexeme}'`); // DEBUG
    
    if (!this.match('SIMBOLO', ';')) {
        console.log(`parseDeclaration: ERROR - Se esperaba ';' pero se encontró '${this.currentToken.lexeme}'`); // DEBUG
        this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    return {
        type: 'DECLARATION',
        dataType: typeToken.lexeme,
        variables: variables,
        line: startLine,
        column: startColumn
    };
}

    // LISTA_VARS ::= VAR_DECL (',' VAR_DECL)*
    parseVariableList() {
        const variables = [];

        const firstVar = this.parseVariableDeclaration();
        if (!firstVar) return null;

        variables.push(firstVar);

        while (this.match('SIMBOLO', ',')) {
            const nextVar = this.parseVariableDeclaration();
            if (!nextVar) return null;
            variables.push(nextVar);
        }

        return variables;
    }

    // VAR_DECL ::= ID ('=' EXPRESION)?
    parseVariableDeclaration() {
        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        let initialValue = null;
        if (this.match('SIMBOLO', '=')) {
            initialValue = this.parseExpression();
            if (!initialValue) return null;
        }

        return {
            name: idToken.lexeme,
            initialValue: initialValue
        };
    }

    // ASIGNACION ::= ID '=' EXPRESION ';'
    parseAssignment() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        if (!this.match('SIMBOLO', '=')) {
            this.addError("Se esperaba '='", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const expression = this.parseExpression();
        if (!expression) return null;

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        return {
            type: 'ASSIGNMENT',
            variable: idToken.lexeme,
            value: expression,
            line: startLine,
            column: startColumn
        };
    }

    // IF ::= 'if' '(' EXPRESION ')' '{' SENTENCIAS '}' ('else' '{' SENTENCIAS '}')?
    parseIf() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        if (!this.match('PALABRA_RESERVADA', 'if')) {
            this.addError("Se esperaba 'if'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const condition = this.parseExpression();
        if (!condition) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const thenStatements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        let elseStatements = null;
        if (this.match('PALABRA_RESERVADA', 'else')) {
            if (!this.match('SIMBOLO', '{')) {
                this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
                return null;
            }

            elseStatements = this.parseStatements();

            if (!this.match('SIMBOLO', '}')) {
                this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
                return null;
            }
        }

        return {
            type: 'IF',
            condition: condition,
            thenStatements: thenStatements,
            elseStatements: elseStatements,
            line: startLine,
            column: startColumn
        };
    }

    // FOR ::= 'for' '(' FOR_INIT ';' EXPRESION ';' FOR_UPDATE ')' '{' SENTENCIAS '}'
    parseFor() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        if (!this.match('PALABRA_RESERVADA', 'for')) {
            this.addError("Se esperaba 'for'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const init = this.parseForInit();
        if (!init) return null;

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const condition = this.parseExpression();
        if (!condition) return null;

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const update = this.parseForUpdate();
        if (!update) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const statements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        return {
            type: 'FOR',
            initialization: init,
            condition: condition,
            update: update,
            statements: statements,
            line: startLine,
            column: startColumn
        };
    }

    // FOR_INIT ::= TIPO ID '=' EXPRESION
    parseForInit() {
        const typeToken = this.expect('PALABRA_RESERVADA');
        if (!typeToken) return null;

        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        if (!this.match('SIMBOLO', '=')) {
            this.addError("Se esperaba '='", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const expression = this.parseExpression();
        if (!expression) return null;

        return {
            type: 'FOR_INIT',
            dataType: typeToken.lexeme,
            variable: idToken.lexeme,
            initialValue: expression
        };
    }

    // FOR_UPDATE ::= ID ('++' | '--')
    parseForUpdate() {
        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        let operator;
        if (this.match('SIMBOLO', '++')) {
            operator = '++';
        } else if (this.match('SIMBOLO', '--')) {
            operator = '--';
        } else {
            this.addError("Se esperaba '++' o '--'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        return {
            variable: idToken.lexeme,
            operator: operator
        };
    }

    // WHILE ::= 'while' '(' EXPRESION ')' '{' SENTENCIAS '}'
    parseWhile() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        if (!this.match('PALABRA_RESERVADA', 'while')) {
            this.addError("Se esperaba 'while'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const condition = this.parseExpression();
        if (!condition) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const statements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        return {
            type: 'WHILE',
            condition: condition,
            statements: statements,
            line: startLine,
            column: startColumn
        };
    }

    // PRINT ::= 'System' '.' 'out' '.' 'println' '(' EXPRESION ')' ';'
    parsePrint() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        if (!this.match('PALABRA_RESERVADA', 'System')) {
            this.addError("Se esperaba 'System'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '.')) {
            this.addError("Se esperaba '.'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'out')) {
            this.addError("Se esperaba 'out'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '.')) {
            this.addError("Se esperaba '.'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'println')) {
            this.addError("Se esperaba 'println'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const expression = this.parseExpression();
        if (!expression) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        return {
            type: 'PRINT',
            expression: expression,
            line: startLine,
            column: startColumn
        };
    }

    // EXPRESION ::= TERMINO (('==' | '!=' | '>' | '<' | '>=' | '<=') TERMINO)*
    parseExpression() {
        let left = this.parseTerm();
        if (!left) return null;

        while (true) {
            const operator = this.match('SIMBOLO');
            if (!operator || !this.isComparisonOperator(operator.lexeme)) {
                break;
            }

            const right = this.parseTerm();
            if (!right) return null;

            left = {
                type: 'BINARY_OPERATION',
                operator: operator.lexeme,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            };
        }

        return left;
    }

    // TERMINO ::= FACTOR (('+' | '-') FACTOR)*
    parseTerm() {
        let left = this.parseFactor();
        if (!left) return null;

        while (true) {
            const operator = this.match('SIMBOLO');
            if (!operator || (operator.lexeme !== '+' && operator.lexeme !== '-')) {
                break;
            }

            const right = this.parseFactor();
            if (!right) return null;

            left = {
                type: 'BINARY_OPERATION',
                operator: operator.lexeme,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            };
        }

        return left;
    }

    // FACTOR ::= PRIMARIO (('*' | '/') PRIMARIO)*
    parseFactor() {
        let left = this.parsePrimary();
        if (!left) return null;

        while (true) {
            const operator = this.match('SIMBOLO');
            if (!operator || (operator.lexeme !== '*' && operator.lexeme !== '/')) {
                break;
            }

            const right = this.parsePrimary();
            if (!right) return null;

            left = {
                type: 'BINARY_OPERATION',
                operator: operator.lexeme,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            };
        }

        return left;
    }

    // PRIMARIO ::= ID | LITERAL | '(' EXPRESION ')'
    parsePrimary() {
        const token = this.currentToken;

        if (token.type === 'IDENTIFICADOR') {
            this.advance();
            return {
                type: 'VARIABLE',
                name: token.lexeme,
                line: token.line,
                column: token.column
            };
        }

        if (token.type === 'ENTERO' || token.type === 'DECIMAL' || 
            token.type === 'CADENA' || token.type === 'CARACTER' ||
            token.type === 'BOOLEANO') {
            this.advance();
            return {
                type: 'LITERAL',
                value: token.lexeme,
                dataType: this.getLiteralType(token),
                line: token.line,
                column: token.column
            };
        }

        if (token.lexeme === '(') {
            this.advance();
            const expression = this.parseExpression();
            if (!expression) return null;

            if (!this.match('SIMBOLO', ')')) {
                this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
                return null;
            }

            return expression;
        }

        this.addError(`Expresión primaria no reconocida: '${token.lexeme}'`, 
                     token.line, token.column);
        return null;
    }

    // Métodos auxiliares
    isComparisonOperator(op) {
        return ['==', '!=', '>', '<', '>=', '<='].includes(op);
    }

    getLiteralType(token) {
        switch (token.type) {
            case 'ENTERO': return 'int';
            case 'DECIMAL': return 'double';
            case 'CADENA': return 'String';
            case 'CARACTER': return 'char';
            case 'BOOLEANO': return 'boolean';
            default: return 'unknown';
        }
    }

    synchronize() {
        // Saltar tokens hasta encontrar un punto de sincronización
        while (this.currentToken.type !== 'EOF') {
            if (this.currentToken.lexeme === ';' || 
                this.currentToken.lexeme === '}' ||
                this.peek().lexeme === 'int' || this.peek().lexeme === 'double' ||
                this.peek().lexeme === 'char' || this.peek().lexeme === 'String' ||
                this.peek().lexeme === 'boolean' || this.peek().lexeme === 'if' ||
                this.peek().lexeme === 'for' || this.peek().lexeme === 'while' ||
                this.peek().lexeme === 'System') {
                return;
            }
            this.advance();
        }
    }

    // Método principal de análisis
    parse() {
        this.ast = this.parseProgram();
        return {
            ast: this.ast,
            errors: this.errors
        };
    }
}